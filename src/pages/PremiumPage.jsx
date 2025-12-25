import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import app from '../firebaseConfig';
import { AlertModal } from '../components/CustomModals'; // Import Modal

const PremiumPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Modal State
  const [alertData, setAlertData] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  
  // Form State
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    const stateData = location.state;
    const user = auth.currentUser;

    if (stateData && stateData.type && stateData.price) {
        setSelectedPlan(stateData);
        if (user) {
            setUserName(user.displayName || "");
            setUserEmail(user.email || "");
        }
        // Generate QR Code
        const rawUpiLink = `upi://pay?pa=hhoneyraghuwanshi-1@okhdfcbank&pn=BSSS_Dating&am=${stateData.price}.00&cu=INR&tn=${stateData.type}_Plan`;
        const encodedUpiLink = encodeURIComponent(rawUpiLink);
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodedUpiLink}`);
    } else {
        navigate('/profile');
    }
  }, [location, navigate, auth]);

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) return;
    
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {
      await addDoc(collection(db, "payment_requests"), {
        userId: user.uid,
        userName: userName,   
        userEmail: userEmail, 
        planId: selectedPlan.type,
        amount: selectedPlan.price,
        transactionId: transactionId,
        status: "pending", 
        createdAt: serverTimestamp(),
      });

      // SHOW SUCCESS MODAL instead of alert
      setAlertData({
        isOpen: true,
        title: "Payment Submitted!",
        message: "Your request has been sent for admin verification. This usually takes 1-2 hours.",
        type: 'success'
      });

    } catch (error) {
      console.error("Error submitting request:", error);
      setAlertData({
        isOpen: true,
        title: "Submission Failed",
        message: "Something went wrong. Please try again.",
        type: 'error'
      });
      setLoading(false); // Only stop loading on error, on success we wait for modal close
    }
  };

  const handleModalClose = () => {
    setAlertData({ ...alertData, isOpen: false });
    if (alertData.type === 'success') {
        navigate('/profile');
    }
  };

  if (!selectedPlan) return null;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-inter">
      
      {/* --- CUSTOM ALERT MODAL --- */}
      <AlertModal 
        isOpen={alertData.isOpen} 
        onClose={handleModalClose}
        title={alertData.title}
        message={alertData.message}
        type={alertData.type}
      />

      <div className="relative bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-[fadeIn_0.3s_ease-out]">
        <button onClick={() => navigate('/profile')} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2">
          <X size={24} />
        </button>

        <div className="text-center mb-6 mt-2">
            <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Complete Payment</h2>
            <p className="text-sm text-gray-400">
              Upgrade to <span className={`font-bold ${selectedPlan.type === 'Gold' ? 'text-yellow-400' : 'text-sky-400'}`}>{selectedPlan.type}</span> for <span className="text-white font-bold">₹{selectedPlan.price}</span>
            </p>
        </div>

        <div className="bg-white p-3 rounded-xl mb-6 mx-auto w-48 h-48 flex items-center justify-center shadow-inner overflow-hidden">
            {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Scan to Pay" className="w-full h-full object-contain" />
            ) : (
                <Loader className="animate-spin text-black" />
            )}
        </div>
        
        <p className="text-center text-xs text-zinc-500 mb-4 px-4">
           Scan using PhonePe, Paytm, or GPay. <br/>
           <span className="text-yellow-500/80">Note: If amount doesn't auto-fill, please enter <b>₹{selectedPlan.price}</b> manually.</span>
        </p>

        <form onSubmit={handleSubmitPayment} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 tracking-wider">Name</label>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full mt-1 bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-sky-500 outline-none placeholder-zinc-700 transition-colors" required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 tracking-wider">Email</label>
            <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="w-full mt-1 bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-sky-500 outline-none placeholder-zinc-700 transition-colors" required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 tracking-wider">Enter Your UPI ID</label>
            <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full mt-1 bg-black border border-white/10 rounded-xl p-3 text-white text-sm focus:border-sky-500 outline-none placeholder-zinc-700 transition-colors" placeholder="Enter UPI ID here" required />
          </div>
          <button disabled={loading} className="w-full py-3.5 mt-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Verifying..." : "Confirm Payment"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PremiumPage;