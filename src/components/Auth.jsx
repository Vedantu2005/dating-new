import React, { useState } from 'react';
import { Heart, Sparkles, Mail, Lock, User, ArrowRight, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signInWithPopup,
    getAuth,
} from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import app, { googleProvider, facebookProvider } from '../firebaseConfig';

const db = getFirestore(app);
const auth = getAuth(app);

const customStyles = `
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }
    @keyframes slide-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

const saveUserData = async (user, displayName, isNewUser) => {
    const avatarLetter = (displayName || user.email?.charAt(0) || 'U').toUpperCase();
    const photoURL = user.photoURL || null;

    if (isNewUser) {
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            displayName: displayName || user.displayName || user.email.split('@')[0],
            email: user.email,
            photos: photoURL ? [photoURL] : [],
            avatarUrl: photoURL || `https://placehold.co/400x400/0ea5e9/white?text=${avatarLetter}`,
            age: '21',
            createdAt: new Date(),
        }, { merge: true });
    }
};

export default function AuthPage() {
    const [view, setView] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const isLoginView = view === 'login';

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isLoginView) {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                await saveUserData(userCredential.user, userCredential.user.displayName, false);
                setSuccess(true);
                setTimeout(() => navigate("/profile"), 1500);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name.trim() });
                await saveUserData(userCredential.user, name.trim(), true);
                setSuccess(true);
                setTimeout(() => navigate("/profile"), 1500);
            }
        } catch (err) {
            setError("Authentication failed. Please try again.");
            setLoading(false);
        }
    };

    const handleSocialLogin = async (providerName) => {
        setLoading(true);
        setError('');
        const selectedProvider = providerName === 'Google' ? googleProvider : facebookProvider;
        try {
            const userCredential = await signInWithPopup(auth, selectedProvider);
            await saveUserData(userCredential.user, userCredential.user.displayName, true);
            setSuccess(true);
            setTimeout(() => navigate("/profile"), 1500);
        } catch (err) {
            setError(`${providerName} login failed.`);
            setLoading(false);
        }
    };

    return (
        <>
            <style>{customStyles}</style>
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black relative overflow-x-hidden font-inter">

                {/* Background Sparkles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <Heart className="absolute top-20 left-10 text-sky-500/10 w-8 h-8 animate-[float_6s_infinite]" />
                    <Sparkles className="absolute bottom-20 right-10 text-blue-400/10 w-10 h-10 animate-[float_7s_infinite]" />
                </div>

                <div className="relative w-full max-w-6xl bg-zinc-900 border border-white/5 rounded-3xl shadow-2xl overflow-hidden z-10">
                    <div className="flex flex-col md:flex-row md:min-h-[700px]">

                        {/* Left Side - Form */}
                        <div className="w-full md:w-1/2 p-6 sm:p-10 md:p-12 flex flex-col justify-center">
                            <div className="mb-8 flex flex-col items-center animate-[slide-in_0.6s_ease-out]">
                                <img src="/logo.png" alt="Logo" className="h-16 md:h-20 w-auto" />
                            </div>

                            {/* Mobile Toggle with Gradient */}
                            <div className="md:hidden flex gap-2 mb-8 p-1 bg-black rounded-xl border border-white/5">
                                <button onClick={() => setView('login')} className={`flex-1 py-3 rounded-lg font-bold transition-all ${isLoginView ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-black' : 'text-gray-500'}`}>Login</button>
                                <button onClick={() => setView('signup')} className={`flex-1 py-3 rounded-lg font-bold transition-all ${!isLoginView ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-black' : 'text-gray-500'}`}>Sign Up</button>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-4 animate-[slide-in_0.5s_ease-out]">
                                <h2 className="text-2xl md:text-3xl font-bold text-white text-center md:text-left leading-tight">
                                    {isLoginView ? 'Welcome!' : 'Join Our Community'}
                                </h2>

                                <p className="-mt-2 text-base md:text-lg font-medium text-white/60 text-center md:text-left leading-relaxed">
                                    {isLoginView
                                        ? 'Login to start meeting amazing people'
                                        : 'Create your account and start your journey'}
                                </p>

                                {!isLoginView && (
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400/60" />
                                        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-black/40 text-white rounded-xl border border-white/10 focus:border-sky-500 transition-all outline-none" required />
                                    </div>
                                )}

                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400/60" />
                                    <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-black/40 text-white rounded-xl border border-white/10 focus:border-sky-500 transition-all outline-none" required />
                                </div>

                                <div className="space-y-2">
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400/60" />
                                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-black/40 text-white rounded-xl border border-white/10 focus:border-sky-500 transition-all outline-none" required />
                                    </div>
                                    
                                    {isLoginView && (
                                        <div className="flex justify-end px-1">
                                            <Link to="/forgot-password" size="sm" className="text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors">
                                                Forgot Password?
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {(error || success) && (
                                    <p className={`text-sm py-3 px-4 rounded-xl text-center font-medium ${error ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'}`}>
                                        {error || "Welcome back! 🎉"}
                                    </p>
                                )}

                                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-black font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <>{isLoginView ? 'Login' : 'Sign Up'} <ArrowRight className="w-5 h-5" /></>}
                                </button>

                                <div className="relative my-6 flex items-center">
                                    <div className="flex-grow border-t border-white/10"></div>
                                    <span className="px-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Or use social</span>
                                    <div className="flex-grow border-t border-white/10"></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button type="button" onClick={() => handleSocialLogin('Google')} className="flex items-center justify-center gap-2 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-white bg-black/20">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                        <span className="text-sm font-semibold">Google</span>
                                    </button>
                                    <button type="button" onClick={() => handleSocialLogin('Facebook')} className="flex items-center justify-center gap-2 py-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all text-white bg-black/20">
                                        <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                        <span className="text-sm font-semibold">Facebook</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Right Side - Info Panel (Gradient) */}
                        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-sky-400 via-blue-600 to-blue-900 p-12 flex-col justify-center items-center text-white text-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                                <Heart className="absolute top-10 left-10 w-24 h-24 animate-[float_6s_infinite]" />
                                <Sparkles className="absolute bottom-10 right-10 w-20 h-20 animate-[float_8s_infinite]" />
                            </div>
                            <div className="relative z-10 animate-[slide-in_0.6s_ease-out]">
                                <h2 className="text-4xl font-extrabold mb-6 leading-tight">
                                    {isLoginView ? "New to BSSS Dating?" : "Welcome!"}
                                </h2>
                                <p className="text-lg opacity-80 mb-10 max-w-xl mx-auto font-medium">
                                    {isLoginView ? "Join our growing community and find meaningful connections. Create your profile today and start your story!" : "Login to explore connections and find people who share your interests and values."}
                                </p>
                                <button onClick={() => setView(isLoginView ? 'signup' : 'login')} className="bg-white text-blue-900 font-bold px-12 py-4 rounded-full hover:scale-105 transition-all shadow-xl active:scale-95">
                                    {isLoginView ? 'Signup Now' : 'Sign In Now'}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}