import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebaseConfig';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (!email) {
                throw new Error("Please enter your email address.");
            }
            
            const functions = getFunctions(app);
            const sendResetEmailFn = httpsCallable(functions, 'sendPasswordReset');
            
            await sendResetEmailFn({ email });
            
            setMessage("Success! Password reset link sent to your email. Please check your inbox.");
        } catch (err) {
            console.error("Password reset error:", err);
            let errorMessage = "Failed to send reset link. Try again later.";
            
            if (err.message === "User not found" || err.code === "functions/not-found") {
                errorMessage = "Email not found. Please check the address.";
            } else if (err.code === "auth/invalid-email") {
                 errorMessage = "Invalid email format.";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-black relative overflow-x-hidden font-inter">
            
            {/* Background Glows to match Auth Page */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-sky-400/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-blue-900/20 blur-[100px] rounded-full" />
            </div>

            <div className="relative w-full max-w-md bg-zinc-900 border border-white/5 rounded-3xl p-6 sm:p-10 shadow-2xl animate-[slide-in_0.5s_ease-out] z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/20">
                        <Mail className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">Forgot Password?</h2>
                    <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Enter your email and we'll send you a recovery link.
                    </p>
                </div>
                
                <form onSubmit={handleReset} className="space-y-6">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400/60 group-focus-within:text-sky-400 transition-colors" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-black/40 text-white rounded-xl border border-white/10 focus:border-sky-500/50 transition-all outline-none placeholder:text-gray-600"
                            required
                            disabled={loading || message}
                        />
                    </div>

                    {message && (
                        <div className="flex items-start gap-3 text-sm text-sky-400 bg-sky-500/10 p-4 rounded-xl border border-sky-500/20">
                            <CheckCircle className="w-5 h-5 shrink-0" /> 
                            <span>{message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-start gap-3 text-sm text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                            <AlertTriangle className="w-5 h-5 shrink-0" /> 
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || message}
                        className="w-full bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-black font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                <span>Sending Link...</span>
                            </>
                        ) : (
                            "Send Reset Link"
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-white/5 pt-6">
                    <Link to="/" className="text-sm text-sky-400 hover:text-sky-300 font-semibold flex items-center justify-center gap-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}