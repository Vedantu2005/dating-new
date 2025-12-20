import React from 'react';
import { Star, Zap, Plus, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PremiumPage = () => {
  const navigate = useNavigate(); 
  
  return (
    <div className="min-h-screen bg-black pb-20 font-inter">
      
      {/* Header */}
      <div className="bg-zinc-950 border-b border-white/5 p-4 sticky top-0 z-10 flex items-center shadow-lg">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-white hover:bg-zinc-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-xl font-black text-white text-center mr-8 tracking-tighter uppercase">Get Premium</h1>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-8">
        
        {/* SECTION 1: BOOST YOUR PROFILE */}
        <div>
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 px-1">Boost Your Profile</h2>
          
          <div className="flex gap-4">
            
            {/* Card 1: Super Likes */}
            <div className="flex-1 bg-zinc-900 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative cursor-pointer hover:border-sky-500/50 transition-all shadow-2xl group active:scale-95">
              <div className="absolute top-3 right-3 text-sky-400">
                <Plus size={16} />
              </div>
              <div className="bg-sky-500/10 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Star size={28} className="text-sky-400" fill="currentColor" />
              </div>
              <h3 className="font-bold text-white text-sm uppercase tracking-tight">Super Likes</h3>
              <p className="text-[10px] text-sky-400 font-black uppercase mt-1">Stand Out</p>
            </div>

            {/* Card 2: Boosts */}
            <div className="flex-1 bg-zinc-900 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative cursor-pointer hover:border-blue-500/50 transition-all shadow-2xl group active:scale-95">
              <div className="absolute top-3 right-3 text-blue-400">
                <Plus size={16} />
              </div>
              <div className="bg-blue-500/10 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Zap size={28} className="text-blue-500" fill="currentColor" />
              </div>
              <h3 className="font-bold text-white text-sm uppercase tracking-tight">Boosts</h3>
              <p className="text-[10px] text-blue-500 font-black uppercase mt-1">Be Top Profile</p>
            </div>

          </div>
        </div>

        {/* SECTION 2: MEMBERSHIP PLANS */}
        <div>
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 px-1">Membership Plans</h2>
          
          {/* Gold Plan */}
          <div className="bg-zinc-900 rounded-[2rem] border border-white/5 overflow-hidden mb-6 shadow-2xl">
            <div className="bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 p-3 text-black text-center font-black text-xs uppercase tracking-widest">
              GOLD
            </div>
            <div className="p-6">
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                  <Check size={18} className="text-sky-400" strokeWidth={3} /> Unlimited Likes
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                  <Check size={18} className="text-sky-400" strokeWidth={3} /> See Who Likes You
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                  <Check size={18} className="text-sky-400" strokeWidth={3} /> 5 Super Likes / week
                </li>
              </ul>
              <button className="w-full py-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black uppercase tracking-tighter shadow-lg hover:opacity-90 transition active:scale-[0.98]">
                Upgrade for $14.99
              </button>
            </div>
          </div>

          {/* Platinum Plan */}
          <div className="bg-zinc-900 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl relative">
             {/* Subtle glow effect for platinum */}
             <div className="absolute inset-0 bg-sky-500/5 pointer-events-none"></div>
             
             <div className="bg-gradient-to-r from-sky-400 to-blue-600 p-3 text-black text-center font-black text-xs uppercase tracking-widest">
              PLATINUM
            </div>
            <div className="p-6 relative z-10">
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-100 font-bold">
                  <Check size={18} className="text-sky-400" strokeWidth={3} /> Everything in Gold
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-100 font-bold">
                  <Check size={18} className="text-sky-400" strokeWidth={3} /> Prioritized Likes
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-100 font-bold">
                  <Check size={18} className="text-sky-400" strokeWidth={3} /> 1 Boost / month
                </li>
              </ul>
              <button className="w-full py-4 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 text-black font-black uppercase tracking-tighter shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:opacity-90 transition active:scale-[0.98]">
                Upgrade for $24.99
              </button>
            </div>
          </div>

        </div>
      </div>
      
      {/* Footer text */}
      <div className="text-center px-8 py-4">
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            BSSS Dating • Secure Payments
          </p>
      </div>
    </div>
  );
};

export default PremiumPage;