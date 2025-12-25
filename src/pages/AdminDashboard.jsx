import React, { useEffect, useState } from 'react';
import { 
    getFirestore, collection, query, where, onSnapshot, 
    doc, writeBatch, serverTimestamp, getDoc 
} from "firebase/firestore";
import { 
    LogOut, CheckCircle, XCircle, 
    Lock, User, Eye, EyeOff, ShieldCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import app from '../firebaseConfig';
import { ConfirmModal, AlertModal } from '../components/CustomModals'; 

const AdminDashboard = () => {
    // --- 1. AUTHENTICATION STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return sessionStorage.getItem('isAdminAuthenticated') === 'true';
    });

    // --- 2. LOCAL STATE ---
    const [requests, setRequests] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const db = getFirestore(app);
    const navigate = useNavigate();

    // --- MODAL STATE ---
    const [confirmData, setConfirmData] = useState({ 
        isOpen: false, title: '', message: '', action: null, isDestructive: false, confirmText: 'Confirm'
    });
    
    const [alertData, setAlertData] = useState({ 
        isOpen: false, title: '', message: '', type: 'success' 
    });

    // --- 3. FETCH REQUESTS ---
    useEffect(() => {
        if (!isAuthenticated) return;

        const q = query(collection(db, "payment_requests"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(data);
        });
        return () => unsubscribe();
    }, [isAuthenticated, db]);

    // --- 4. LOGIN HANDLER ---
    const handleLogin = (e) => {
        e.preventDefault();
        if (email === 'honey@gmail.com' && password === 'Honey@123') {
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            setIsAuthenticated(true);
            setLoginError('');
        } else {
            setLoginError('Invalid Admin Credentials');
        }
    };

    // --- 5. LOGOUT HANDLER ---
    const handleLogoutClick = () => {
        setConfirmData({
            isOpen: true,
            title: "Logout?",
            message: "Are you sure you want to exit the admin dashboard?",
            isDestructive: true,
            confirmText: "Logout",
            action: () => {
                sessionStorage.removeItem('isAdminAuthenticated');
                setIsAuthenticated(false);
                setEmail('');
                setPassword('');
            }
        });
    };

    // --- 6. APPROVE LOGIC (STRICT DAY COUNTS) ---
    const initiateApprove = (req) => {
        setConfirmData({
            isOpen: true,
            title: "Approve & Activate?",
            message: `Activate ${req.planId} for ${req.userName}?`,
            isDestructive: false,
            confirmText: "Approve",
            action: () => executeApprove(req)
        });
    };

    const executeApprove = async (req) => {
        try {
            const batch = writeBatch(db);

            // A. Mark Request as Approved
            const requestRef = doc(db, "payment_requests", req.id);
            batch.update(requestRef, { status: "approved", processedAt: serverTimestamp() });

            // B. Get User to check for existing plan (Smart Renewal)
            const userRef = doc(db, "users", req.userId);
            const userSnap = await getDoc(userRef);
            const userData = userSnap.data();

            // --- DATE CALCULATION LOGIC ---
            let baseDate = new Date(); // Start from "Now"
            const planType = (req.planId || '').toLowerCase().trim();
            const currentTier = (userData?.subscriptionTier || '').toLowerCase().trim();

            // Check existing expiry safely
            let existingExpiry = null;
            if (userData?.subscriptionExpiry) {
                if (typeof userData.subscriptionExpiry.toDate === 'function') {
                    existingExpiry = userData.subscriptionExpiry.toDate();
                } else {
                    existingExpiry = new Date(userData.subscriptionExpiry);
                }
            }

            const isFuture = existingExpiry && !isNaN(existingExpiry) && existingExpiry > new Date();

            // RENEWAL: If renewing the SAME plan and it's still active, extend the existing date
            if (planType === currentTier && isFuture) {
                baseDate = existingExpiry;
            }
            // NEW PLAN: Start from Today (baseDate remains new Date())

            // --- APPLY EXACT VALIDITY DAYS ---
            if (planType.includes('weekly')) {
                baseDate.setDate(baseDate.getDate() + 7); // Exactly 7 Days
            } else if (planType.includes('platinum')) {
                baseDate.setDate(baseDate.getDate() + 90); // Exactly 90 Days
            } else if (planType.includes('gold')) {
                baseDate.setDate(baseDate.getDate() + 30); // Exactly 30 Days
            } else {
                // Fallback for unknown plans (default to 30 days)
                baseDate.setDate(baseDate.getDate() + 30); 
            }
            // -----------------------------

            const isoDate = baseDate.toISOString();

            // C. Update User Subscription
            batch.update(userRef, {
                subscriptionTier: req.planId,
                isPremium: true,
                subscriptionDate: new Date().toISOString(),
                subscriptionExpiry: isoDate
            });

            // D. Update Profile Artifact (Critical for UI Sync)
            // Use dynamic app ID path if available, or fallback to 'default-app-id'
            // NOTE: Ensure this matches your Profile.jsx configuration
            const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'default-app-id';
            const artifactRef = doc(db, `artifacts/${appId}/users/${req.userId}/profile/data`);
            
            batch.set(artifactRef, { 
                subscriptionTier: req.planId,
                subscriptionExpiry: isoDate 
            }, { merge: true });

            await batch.commit();

            setAlertData({
                isOpen: true,
                title: "Plan Activated",
                message: `${req.userName} is now ${req.planId}. Expires: ${baseDate.toLocaleDateString()}`,
                type: "success"
            });

        } catch (error) {
            console.error("Error approving:", error);
            setAlertData({
                isOpen: true,
                title: "Error",
                message: "Failed to update database.",
                type: "error"
            });
        }
    };

    // --- 7. REJECT LOGIC ---
    const initiateReject = (req) => {
        setConfirmData({
            isOpen: true,
            title: "Reject Payment?",
            message: `Reject request from ${req.userName}? This cannot be undone.`,
            isDestructive: true,
            confirmText: "Reject",
            action: () => executeReject(req)
        });
    };

    const executeReject = async (req) => {
        try {
            const batch = writeBatch(db);
            const requestRef = doc(db, "payment_requests", req.id);
            batch.update(requestRef, { status: "rejected", processedAt: serverTimestamp() });
            await batch.commit();
            
            setAlertData({
                isOpen: true,
                title: "Request Rejected",
                message: "The payment request has been rejected.",
                type: "success" 
            });
        } catch (error) {
            console.error("Error rejecting:", error);
            setAlertData({ isOpen: true, title: "Error", message: "Failed to reject.", type: "error" });
        }
    };

    // --- RENDER: LOGIN SCREEN ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 font-inter">
                <div className="w-full max-w-md bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-sky-600/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="text-center mb-8 relative z-10">
                        <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-inner">
                            <ShieldCheck size={32} className="text-sky-500" />
                        </div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Admin Portal</h1>
                        <p className="text-zinc-500 text-sm mt-1">Restricted Access Only</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                        {loginError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center font-bold">
                                {loginError}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 tracking-wider">Email ID</label>
                            <div className="relative">
                                <User size={18} className="absolute left-3 top-3.5 text-zinc-500" />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder-zinc-700"
                                    placeholder="admin@bsss.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1 tracking-wider">Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-3.5 text-zinc-500" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder-zinc-700"
                                    placeholder="••••••••"
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-zinc-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-3.5 mt-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            Access Dashboard
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- RENDER: DASHBOARD ---
    return (
        <div className="min-h-screen bg-black text-white p-6 font-inter">
            <ConfirmModal 
                isOpen={confirmData.isOpen}
                onClose={() => setConfirmData({ ...confirmData, isOpen: false })}
                onConfirm={confirmData.action}
                title={confirmData.title}
                message={confirmData.message}
                isDestructive={confirmData.isDestructive}
                confirmText={confirmData.confirmText}
            />
            
            <AlertModal
                isOpen={alertData.isOpen}
                onClose={() => setAlertData({ ...alertData, isOpen: false })}
                title={alertData.title}
                message={alertData.message}
                type={alertData.type}
            />

            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4 max-w-6xl mx-auto">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage Payment Requests</p>
                </div>
                <button 
                    onClick={handleLogoutClick}
                    className="flex items-center gap-2 bg-zinc-900 text-zinc-400 border border-zinc-800 px-4 py-2 rounded-xl hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50 transition-all font-bold text-sm"
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>
            
            <div className="max-w-6xl mx-auto">
                {requests.length === 0 ? (
                    <div className="text-center py-24 bg-zinc-900/50 border border-white/5 rounded-3xl border-dashed">
                        <CheckCircle size={48} className="text-zinc-700 mx-auto mb-4" />
                        <p className="text-zinc-500 text-lg font-medium">All caught up! No pending requests.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="bg-zinc-900 border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl hover:border-white/20 transition-all">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-lg text-white">{req.userName}</h3>
                                        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md border border-white/5">{req.userEmail}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-sm mt-2">
                                        <div className="flex items-center gap-1.5 text-zinc-400">
                                            <span>Plan:</span>
                                            <span className={`font-black uppercase ${req.planId === 'Gold' ? 'text-yellow-400' : 'text-sky-400'}`}>{req.planId}</span>
                                        </div>
                                        <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                                        <div className="flex items-center gap-1.5 text-zinc-400">
                                            <span>Amount:</span>
                                            <span className="text-green-400 font-bold font-mono">₹{req.amount}</span>
                                        </div>
                                        <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                                        <div className="flex items-center gap-2 bg-black px-3 py-1 rounded-lg border border-white/10">
                                            <span className="text-zinc-500 text-xs font-bold uppercase">Txn ID</span>
                                            <span className="text-white font-mono tracking-wide">{req.transactionId}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-zinc-600 mt-2 font-medium">
                                        Requested: {req.createdAt?.toDate().toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button 
                                        onClick={() => initiateApprove(req)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                                    >
                                        <CheckCircle size={18} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => initiateReject(req)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600 hover:text-white hover:border-red-600 px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                                    >
                                        <XCircle size={18} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;