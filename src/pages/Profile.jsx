import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  Pencil,
  ChevronRight,
  Plus,
  Lock,
  Check,
  Heart,
  Star,
  Zap,
  Flame,
  X,
  LogOut,
  Loader,
  User,
  GraduationCap,
  Palette,
  Code2,
  Share2,
  MessageCircle,
  Instagram,
  ArrowLeft
} from 'lucide-react';

// Firebase Imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Internal Imports
import app, { db as sharedDb, storage as sharedStorage } from '../firebaseConfig';
import EditProfile from '../components/EditProfile.jsx';

// --- CONFIGURATION & UTILITIES ---
const FALLBACK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBEHnNpIfnVyqpcbA5ysFPa-ku87VdMYV0",
  authDomain: "bsss-dating.firebaseapp.com",
  projectId: "bsss-dating",
  storageBucket: "bsss-dating.firebasestorage.app",
  messagingSenderId: "186492166278",
  appId: "1:186492166278:web:92b9d24a2830fb7d97b107",
  measurementId: "G-Z3CCD9ZPMJ"
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const getFirebaseConfig = () => {
  try {
    const injectedConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
    if (Object.keys(injectedConfig).length > 0) {
      return injectedConfig;
    }
  } catch (e) { }
  return FALLBACK_FIREBASE_CONFIG;
};

const getUserDocPath = (userId) => {
  return `artifacts/${appId}/users/${userId}/profile/data`;
};

const loadRazorpayScript = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// --- UI COMPONENTS ---

const DoubleDateIcon = () => (
  <div className="flex items-center justify-center w-12 h-12 bg-sky-900/30 rounded-full">
    <Heart
      size={24}
      fill="currentColor"
      className="text-sky-400"
    />
  </div>
);

const BrandLogo = ({ type, textColor = "text-white" }) => (
  <div className="flex items-baseline space-x-2">
    <span className={`text-3xl font-extrabold ${textColor}`}>BSSS</span>
    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase ${type === 'Gold' ? 'bg-black text-yellow-500' :
      type === 'Platinum' ? 'bg-white text-black' :
        'bg-sky-500 text-white'
      }`}>
      {type}
    </span>
  </div>
);

// --- PROFILE HEADER WITH BADGE LOGIC ---
const ProfileHeader = ({ userData, onNavigate, onSignOut, db }) => {
  const user = userData?.auth;
  const profile = userData?.profile || {};

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const fields = [
    user?.displayName || profile.name,
    user?.photoURL || profile.photos?.[0],
    profile.age,
    profile.city,
    profile.gender,
    profile.aboutMe,
    profile.jobTitle,
    profile.photos?.length > 0
  ];
  const completed = fields.filter(Boolean).length;
  const percentage = Math.max(10, Math.round((completed / fields.length) * 100));

  const displayName = user?.displayName || profile.name || "User";
  const age = profile.age || "";
  const displayAge = age ? `, ${age}` : "";

  const uploadedPhoto = profile.photos && profile.photos.length > 0 ? profile.photos[0] : null;
  const authPhoto = user?.photoURL;
  const realPhoto = uploadedPhoto || authPhoto;
  const placeholder = `https://placehold.co/100x100/0c4a6e/e0f2fe?text=${displayName?.[0] || 'U'}`;
  const displayPhoto = preview || realPhoto || placeholder;
  const hasImage = !!(preview || realPhoto);

  // LOGIC TO DETERMINE BADGE (Case Insensitive)
  const getBadge = () => {
    const tier = profile.subscriptionTier?.toLowerCase(); 
    
    if (tier === 'weekly') {
      return <CheckCircle2 size={20} className="text-white fill-sky-500 ml-1" />;
    }
    if (tier === 'gold') {
      return <CheckCircle2 size={20} className="text-black fill-yellow-400 ml-1" />;
    }
    if (tier === 'platinum') {
      return <CheckCircle2 size={20} className="text-white fill-zinc-500 ml-1" />;
    }
    return null; 
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const storageRef = ref(sharedStorage, `users/${user.uid}/photos/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const newPhotos = [url, ...(profile.photos || [])];

      const profileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile/data`);
      await setDoc(profileRef, { photos: newPhotos }, { merge: true });

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { photos: newPhotos }, { merge: true });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      alert(`Failed to upload photo: ${error.message}`);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center w-full px-4 pt-6">
      <div className="mr-4 relative w-24 h-24 flex-shrink-0">
        <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
          <circle className="text-zinc-800" strokeWidth="6" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
          <circle
            className="text-sky-500 transition-all duration-1000 ease-out"
            strokeWidth="6"
            strokeDasharray="289"
            strokeDashoffset={289 - (percentage / 100) * 289}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="46"
            cx="50"
            cy="50"
          />
        </svg>

        <div className="absolute inset-0 p-1.5 rounded-full">
          <label className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden cursor-pointer relative group bg-zinc-900 shadow-inner ${!hasImage ? 'bg-sky-900/20 border border-dashed border-sky-800' : ''}`}>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <Loader className="animate-spin text-white" size={24} />
              </div>
            )}
            {hasImage ? (
              <img className="w-full h-full rounded-full object-cover" src={displayPhoto} alt="Profile" onError={(e) => e.target.src = placeholder} />
            ) : (
              <Plus size={32} className="text-sky-400" />
            )}
          </label>
        </div>
      </div>

      <div className="flex flex-col items-start z-10">
        <div className="flex items-center space-x-1">
          <h1 className="text-2xl font-bold truncate max-w-[140px] text-white">{displayName}{displayAge}</h1>
          {getBadge()}
        </div>
        <button
          onClick={() => onNavigate('edit')}
          className="flex items-center cursor-pointer justify-center px-4 py-2 mt-2 space-x-2 text-sm font-semibold text-black bg-sky-400 rounded-full shadow-md hover:bg-sky-300 transition-colors"
        >
          <Pencil size={14} />
          <span>Edit profile</span>
        </button>
      </div>
      <div className="ml-auto block md:hidden">
        <button
          onClick={onSignOut}
          className="text-zinc-500 hover:text-red-500 transition-colors p-2"
          title="Sign Out"
        >
          <LogOut size={24} />
        </button>
      </div>
    </div>
  );
};

const DoubleDateBanner = ({ user }) => {
  const userName = user?.displayName || user?.name || "your friend";
  const appUrl = "https://dating-app-lemon-tau.vercel.app/";
  const inviteText = `Hey! I'm using BSSS Dating to find my perfect match. Join ${userName} and check it out! ❤️ ${appUrl}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'BSSS Dating', text: inviteText, url: appUrl });
      } catch (error) { console.log('Error sharing:', error); }
    } else {
      try {
        await navigator.clipboard.writeText(inviteText);
        alert("Invite link copied to clipboard!");
      } catch (err) { alert("Unable to copy link"); }
    }
  };

  return (
    <div className="px-4 mt-6">
      <div
        onClick={handleNativeShare}
        className="flex items-center justify-between cursor-pointer p-4 bg-zinc-900 border border-white/5 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 group"
      >
        <div className="flex items-center space-x-4">
          <DoubleDateIcon />
          <div>
            <h2 className="font-bold text-white group-hover:text-sky-400 transition-colors">Try Double Date</h2>
            <p className="text-sm text-zinc-400">Invite friends & find pairs.</p>
          </div>
        </div>
        <ChevronRight size={24} className="text-zinc-600 group-hover:text-sky-400 transition-colors" />
      </div>
    </div>
  );
};

const ActionGrid = ({ onNavigate }) => (
  <div className="px-4 mt-8">
    <h3 className="text-lg font-bold text-white mb-3 px-1">Boost Your Profile</h3>
    <div className="grid grid-cols-2 gap-3">
      <ActionCard
        icon={<Star size={36} className="text-purple-600" fill="currentColor" />}
        title="Super Likes"
        subtitle="Stand Out"
        subtitleColor="text-purple-600"
        onClick={() => onNavigate('premium')}
      />
      <ActionCard
        icon={<Zap size={36} className="text-red-500" fill="currentColor" />}
        title="Boosts"
        subtitle="Be Top Profile"
        subtitleColor="text-red-500"
        onClick={() => onNavigate('premium')}
      />
    </div>
  </div>
);

const ActionCard = ({ icon, title, subtitle, subtitleColor, onClick }) => (
  <div
    onClick={onClick}
    className="relative flex flex-col items-center justify-center h-32 p-3 text-center bg-zinc-900 border border-white/5 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-95 duration-150"
  >
    <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-zinc-800 rounded-full">
      <Plus size={14} className="text-sky-400" />
    </div>
    <div className="mt-2">{icon}</div>
    <h3 className="mt-2 text-sm font-semibold text-white">{title}</h3>
    {subtitle && (
      <p className={`mt-1 text-xs font-bold ${subtitleColor}`}>{subtitle}</p>
    )}
  </div>
);

const FeatureRow = ({ title, textColor, currentType, freeFeatures }) => {
  const isFreeFeature = freeFeatures.includes(title);
  return (
    <div className="grid grid-cols-3 items-center mt-3 text-center border-b border-white/5 pb-2 last:border-0">
      <span className={`text-[11px] xs:text-sm font-medium text-left truncate pr-1 ${textColor}`}>
        {title}
      </span>
      <span className={`flex justify-center ${textColor} opacity-40`}>
        {isFreeFeature ? <Check size={18} /> : <Lock size={16} />}
      </span>
      <span className={`flex justify-center ${textColor}`}>
        <Check size={18} />
      </span>
    </div>
  );
};

// --- UPGRADE CARD WITH CUSTOM ACTIVE BUTTON STYLES ---
const UpgradeCard = ({ data, freeFeatures, onUpgrade, isCurrent }) => {
  return (
    <div className="min-w-full px-4 box-border snap-center md:min-w-0 md:px-0 flex flex-col">
      <div className={`p-5 rounded-[24px] shadow-lg bg-gradient-to-br ${data.gradient} flex flex-col flex-1 min-h-[280px]`}>
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <BrandLogo type={data.type} textColor={data.textColor} />
          <button
            onClick={() => !isCurrent && onUpgrade && onUpgrade(data)}
            disabled={isCurrent}
            className={`px-6 py-2 font-bold rounded-full shadow-md text-sm transition-all ${
              isCurrent 
                ? (data.type === 'Gold' ? "bg-black text-yellow-400 cursor-default" : "bg-white text-black cursor-default")
                : `${data.btnColor} ${data.btnTextColor} hover:opacity-90 cursor-pointer active:scale-95`
            }`}
          >
            {isCurrent ? "Active" : "Upgrade"}
          </button>
        </div>

        {/* Content Section */}
        <div className={`flex-1 ${data.textColor}`}>
          <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider font-bold text-center mb-4 border-b border-current/10 pb-2">
            <span className="text-left">Plan Perks</span>
            <span className="opacity-60">Free</span>
            <span className="opacity-100">{data.type}</span>
          </div>

          <div className="flex flex-col justify-start">
            {data.features.map((feature, index) => (
              <FeatureRow 
                key={index} 
                title={feature} 
                textColor={data.textColor} 
                currentType={data.type} 
                freeFeatures={freeFeatures} 
              />
            ))}
          </div>
        </div>

        <p className={`text-center text-[10px] mt-4 opacity-60 font-medium ${data.textColor}`}>
          Cancel anytime • Secure Payment
        </p>
      </div>
    </div>
  );
};

// --- CAROUSEL (Case Insensitive Check) ---
const UpgradeCarousel = ({ onUpgrade, currentTier }) => {
  const [activeIndex, setActiveIndex] = useState(1);
  const scrollRef = useRef(null);
  
  // TIERS WITH PRICES
  const tiers = [
    {
      type: 'Weekly',
      price: 29,
      gradient: 'from-sky-600 to-blue-900',
      textColor: 'text-white',
      btnColor: 'bg-white',
      btnTextColor: 'text-sky-900',
      features: ['Limited Likes', 'Limited Chats', 'Weekly Blue Tick']
    },
    {
      type: 'Gold',
      price: 89,
      gradient: 'from-yellow-300 via-amber-400 to-orange-400',
      textColor: 'text-black',
      btnColor: 'bg-black',
      btnTextColor: 'text-yellow-400',
      features: ['Unlimited Likes', 'Unlimited Chats', 'Gold Tick']
    },
    {
      type: 'Platinum',
      price: 199,
      gradient: 'from-zinc-700 via-zinc-800 to-black',
      textColor: 'text-white',
      btnColor: 'bg-white',
      btnTextColor: 'text-black',
      features: ['Rewind Swipe', 'Profile Boost', 'Grey Tick']
    },
  ];

  const freeFeatures = []; 
  
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      setActiveIndex(Math.round(scrollLeft / width));
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: width * 0, behavior: 'auto' });
    }
  }, []);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-white mb-3 px-5">Membership Plans</h3>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 md:grid md:grid-cols-3 md:gap-4 md:px-4 md:overflow-visible"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tiers.map((tier, index) => (
          <UpgradeCard 
            key={index} 
            data={tier} 
            freeFeatures={freeFeatures} 
            onUpgrade={onUpgrade} 
            isCurrent={currentTier?.toLowerCase() === tier.type.toLowerCase()} // Case Insensitive Match
          />
        ))}
      </div>
      <div className="flex justify-center w-full space-x-1.5 md:hidden">
        {tiers.map((_, index) => (
          <div key={index} className={`w-2 h-2 rounded-full transition-colors duration-300 ${activeIndex === index ? 'bg-sky-400' : 'bg-zinc-700'}`}></div>
        ))}
      </div>
    </div>
  );
};

const AuthorSection = ({ onOpenPopup }) => (
  <div className="px-4 mt-8 mb-4">
    <button
      onClick={onOpenPopup}
      className="w-full p-3 bg-zinc-900 border border-white/5 cursor-pointer rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
          <img src="/honey1.jpg" alt="Honey" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/100x100?text=HR'} />
        </div>
        <div className="text-left">
          <p className="text-xs text-zinc-500 font-medium">Created by</p>
          <p className="text-sm font-bold text-white">Anonymous</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-zinc-600 group-hover:text-sky-400 transition-colors" />
    </button>
  </div>
);

const AuthorPopup = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
      <div className="relative h-40 bg-gradient-to-br from-sky-400 via-blue-600 to-sky-900 flex items-center justify-center">
        <button onClick={onClose} className="absolute top-4 cursor-pointer right-4 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white">
          <X size={20} />
        </button>
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center shadow-xl overflow-hidden border-4 border-zinc-900">
          <img src="/honey1.jpg" alt="Honey" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://placehold.co/100x100?text=HR'} />
        </div>
      </div>
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">Anonymous</h2>
          <p className="text-sm text-zinc-500 mt-1">Developer</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 bg-white/5 p-4 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Professional</p>
              <p className="text-xs text-zinc-400 mt-1">Studying in BSSS College 3rd year in 6th Semester</p>
            </div>
          </div>
          <a href="https://www.instagram.com/bsssdating?igsh=MW92bmpja2M3N2ZnOA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="flex items-start space-x-3 bg-white/5 p-4 rounded-xl hover:bg-sky-500/10 transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-all
  bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]">
              <Instagram className="text-white w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-white">Instagram</p>
              <p className="text-xs text-zinc-400 mt-1">Follow - @bsssdating</p>
            </div>
          </a>
        </div>
        <button onClick={onClose} className="w-full mt-6 py-3 cursor-pointer bg-gradient-to-r from-sky-400 to-blue-600 text-black font-bold rounded-full hover:shadow-lg transition-all">Got it!</button>
      </div>
    </div>
  </div>
);

const PremiumView = ({ onNavigate, onUpgrade }) => {
  return (
    <div className="flex flex-col bg-black relative min-h-full">
      <div className="p-4 flex items-center border-b border-white/10 sticky top-0 bg-black z-10">
        <button onClick={() => onNavigate('profile')} className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="ml-2 text-xl font-bold text-white">Get Premium</h1>
      </div>
      <div className="flex-1 pb-8">
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-full mb-4 shadow-lg">
            <Star size={40} className="text-white fill-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Unlock All Features</h2>
          <p className="text-zinc-500 mb-6">Get unlimited likes, see who likes you, and boost your profile visibility.</p>
        </div>
        <UpgradeCarousel onUpgrade={onUpgrade} />
      </div>
    </div>
  );
};

const ProfileScreen = ({ onNavigate, userData, onSignOut, db, onUpgrade }) => {
  const [showAuthorPopup, setShowAuthorPopup] = useState(false);
  // EXTRACT CURRENT TIER
  const currentTier = userData?.profile?.subscriptionTier; 

  return (
    <div className="flex flex-col pb-4 bg-black">
      <ProfileHeader userData={userData} onNavigate={onNavigate} onSignOut={onSignOut} db={db} />
      <DoubleDateBanner user={userData?.profile || userData?.auth} />
      <ActionGrid onNavigate={onNavigate} />
      {/* PASS CURRENT TIER */}
      <UpgradeCarousel onUpgrade={onUpgrade} currentTier={currentTier} />
      <AuthorSection onOpenPopup={() => setShowAuthorPopup(true)} />
      {showAuthorPopup && <AuthorPopup onClose={() => setShowAuthorPopup(false)} />}
    </div>
  );
};

export default function Profile() {
  const [authInstance, setAuthInstance] = useState(null);
  const [dbInstance, setDbInstance] = useState(null);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [currentView, setCurrentView] = useState('profile');

  // --- UPDATED PAYMENT HANDLER (UPDATES FIRESTORE ON SUCCESS) ---
  const handleUpgrade = async (plan) => {
    if (!plan.price) {
      alert("Invalid plan price");
      return;
    }
    
    const res = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) { 
      alert("Razorpay SDK failed to load. Are you online?"); 
      return; 
    }

    try {
      const options = {
        key: "rzp_test_RoMYE85wG1Vzew", 
        amount: plan.price * 100, 
        currency: "INR",
        name: "BSSS Dating",
        description: `Upgrade to ${plan.type}`,
        handler: async function (response) {
          console.log("Payment Successful", response);
          
          if (user?.uid && dbInstance) {
            // 1. Update Users collection (Main Record)
            await updateDoc(doc(dbInstance, "users", user.uid), {
              subscriptionTier: plan.type,
              subscriptionDate: new Date().toISOString(),
              paymentId: response.razorpay_payment_id
            });
            
            // 2. Update Artifacts collection (Profile UI Listener)
            // This ensures the "Active" button updates instantly without refresh
            const artifactRef = doc(dbInstance, getUserDocPath(user.uid));
            await setDoc(artifactRef, { 
                subscriptionTier: plan.type 
            }, { merge: true });

            alert(`Success! You are now a ${plan.type} member.`);
          }
        },
        prefill: { 
          name: userData?.profile?.name || user?.displayName || "", 
          email: user?.email || "" 
        },
        theme: { 
          color: plan.type === 'Gold' ? '#ffc107' : plan.type === 'Platinum' ? '#333' : '#38bdf8' 
        }
      };
      
      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (error) { 
      console.error("Payment Error:", error);
      alert(`Something went wrong: ${error.message}`); 
    }
  };

  useEffect(() => {
    const firebaseConfig = getFirebaseConfig();
    const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);
    setAuthInstance(auth);
    setDbInstance(db);
    return onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) { setUser(currentUser); setUserId(currentUser.uid); setLoading(false); }
      else { setLoading(false); }
    });
  }, []);

  // --- LISTEN TO BOTH COLLECTIONS ---
  useEffect(() => {
    if (dbInstance && userId && user) {
      // Listener 1: Artifacts (Profile Data)
      const unsubArtifacts = onSnapshot(doc(dbInstance, getUserDocPath(userId)), (docSnap) => {
        const artifactData = docSnap.exists() ? docSnap.data() : {};
        
        setUserData(prev => {
           const existingProfile = prev?.profile || {};
           return {
               auth: user,
               profile: {
                   ...existingProfile,
                   ...artifactData,
                   name: user.displayName,
                   age: artifactData.age || ""
               }
           };
        });
      });

      // Listener 2: Users Collection (Subscription Tier)
      const unsubUsers = onSnapshot(doc(dbInstance, "users", userId), (docSnap) => {
        if (docSnap.exists()) {
            const userDocData = docSnap.data();
            
            setUserData(prev => {
                const existingProfile = prev?.profile || {};
                return {
                    auth: user,
                    profile: {
                        ...existingProfile,
                        subscriptionTier: userDocData.subscriptionTier, 
                    }
                };
            });
        }
      });

      return () => {
        unsubArtifacts();
        unsubUsers();
      };
    }
  }, [dbInstance, userId, user]);

  const navigate = useCallback((view) => setCurrentView(view), []);

  const handleSignOut = async () => { if (authInstance) { await signOut(authInstance); } };

  const renderView = () => {
    if (loading) return <div className="flex flex-col items-center justify-center h-full pt-20 bg-black"><Loader size={32} className="text-sky-500 animate-spin" /></div>;
    if (!user) return <div className="flex flex-col items-center justify-center h-full pt-20 p-8 bg-black text-white"><User size={48} className="text-sky-500 mb-4" /><div className="text-xl font-bold">Authentication Required</div></div>;
    switch (currentView) {
      case 'profile': return <ProfileScreen onNavigate={navigate} userData={userData} onSignOut={handleSignOut} db={dbInstance} onUpgrade={handleUpgrade} />;
      case 'edit': return <EditProfile onNavigate={navigate} userData={userData} setUserData={setUserData} db={sharedDb} userId={userId} storage={sharedStorage} />;
      case 'premium': return <PremiumView onNavigate={navigate} onUpgrade={handleUpgrade} />;
      default: return <ProfileScreen onNavigate={navigate} userData={userData} onSignOut={handleSignOut} db={dbInstance} onUpgrade={handleUpgrade} />;
    }
  };

  return (
    <div className="flex justify-center min-h-screen p-4 bg-zinc-950 font-inter">
      <div className="w-full max-w-sm bg-black rounded-2xl shadow-xl sm:max-w-[95%] border border-white/5 overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
}