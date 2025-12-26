import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Send,
  Search,
  Heart,
  Loader2,
  MoreVertical,
  Sparkles,
  X 
} from "lucide-react";
import { db, realtimeDB } from "../firebaseConfig"; // Removed 'storage'
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from 'react-router-dom';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "firebase/firestore";
import { ref as rtdbRef, onValue } from "firebase/database";

// Custom styles to hide scrollbars
const customStyles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// --- COMPONENT: Full Screen Image Modal ---
// Kept in case you still want to view existing images sent by others
const ImageModal = ({ src, onClose }) => {
    if (!src) return null;
    return (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-zinc-800/50 rounded-full text-white hover:bg-zinc-700 transition-colors">
                <X className="w-6 h-6" />
            </button>
            <img 
                src={src} 
                alt="Full screen" 
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()} 
            />
        </div>
    );
};

const UpgradeModal = ({ isOpen, onClose, title, message }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
            <div className="bg-zinc-900 border border-white/10 rounded-[2rem] p-8 w-full max-w-sm shadow-2xl text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-sky-500/10 mb-6">
                    <Sparkles className="h-8 w-8 text-sky-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 mb-8">{message}</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => navigate('/profile')} className="w-full py-4 bg-gradient-to-r from-sky-400 to-blue-600 text-black rounded-2xl font-black text-lg shadow-lg">Upgrade Now</button>
                    <button onClick={onClose} className="w-full py-3 text-gray-500 font-bold">Maybe Later</button>
                </div>
            </div>
        </div>
    );
};

// Safe Chat ID generation
const getChatId = (userAId, userBId) => {
  if (!userAId || !userBId) return "invalid_chat";
  return userAId < userBId ? `${userAId}_${userBId}` : `${userBId}_${userAId}`;
};

const ChatList = ({ setSelectedChat, selectedChatId, currentUserId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    try {
        const statusRef = rtdbRef(realtimeDB, "status");
        const unsub = onValue(statusRef, (snap) => setStatuses(snap.val() || {}));
        return () => unsub();
    } catch (err) {
        console.error("Status error:", err);
    }
  }, []);

  const toggleFavorite = async (e, match) => {
    e.stopPropagation(); 
    if (!currentUserId || !match.chatId) return;
    const matchRef = doc(db, "matches", match.chatId);
    try {
      await updateDoc(matchRef, { [`favorites.${currentUserId}`]: !match.isFavorite });
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (!currentUserId) { setIsLoading(false); return; }
    
    try {
        const matchesQuery = query(collection(db, "matches"), where(`usersIncluded.${currentUserId}`, "==", true));
        
        const unsubscribe = onSnapshot(matchesQuery, async (snapshot) => {
            const promises = snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                if (!data.users) return null;
                
                const otherUserId = data.users.find(uid => uid !== currentUserId);
                if (!otherUserId) return null;
                try {
                    const userSnap = await getDoc(doc(db, "users", otherUserId));
                    if (!userSnap.exists()) return null;
                    const userData = userSnap.data();
                    if (searchTerm && userData.displayName && !userData.displayName.toLowerCase().includes(searchTerm.toLowerCase())) return null;
                    return {
                        id: otherUserId, chatId: docSnap.id, name: userData.displayName || "User",
                        avatarUrl: userData.photos?.[0] || userData.avatarUrl || "https://placehold.co/100",
                        lastMessage: data.lastMessage || "Start chatting...", isFavorite: data.favorites?.[currentUserId] === true,
                        timestamp: data.timestamp
                    };
                } catch (e) { return null; }
            });
            const results = await Promise.all(promises);
            const validUsers = results.filter(Boolean).sort((a, b) => (a.isFavorite !== b.isFavorite ? (a.isFavorite ? -1 : 1) : (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
            setUsers(validUsers);
            setIsLoading(false);
        });
        return () => unsubscribe();
    } catch (err) {
        console.error("ChatList error:", err);
        setIsLoading(false);
    }
  }, [currentUserId, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-black border-r border-white/5 overflow-hidden">
      <div className="px-6 py-6 bg-black text-white z-10 flex-shrink-0">
        <h1 className="text-3xl font-black mb-6 tracking-tight bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">Messages</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search matches..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-zinc-900/50 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500/50 border border-white/5" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 space-y-1 overscroll-contain">
        {isLoading ? (
            <div className="py-10 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-sky-500" /></div>
        ) : users.length > 0 ? (
            users.map((match) => {
              const isOnline = statuses[match.id]?.state === "online";
              return (
                <button key={match.id} onClick={() => setSelectedChat(match)}
                  className={`w-full p-4 rounded-[1.5rem] flex items-center gap-4 transition-all group ${selectedChatId === match.id ? "bg-zinc-900 border border-white/10" : "hover:bg-zinc-900/40"}`}>
                  <div className="relative shrink-0">
                    <img src={match.avatarUrl} className="w-14 h-14 rounded-full object-cover border border-white/5" alt="" />
                    {isOnline && <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-black rounded-full shadow-lg"></div>}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-white truncate text-base">{match.name}</h3>
                        <Heart onClick={(e) => toggleFavorite(e, match)} className={`w-5 h-5 transition-all ${match.isFavorite ? "fill-red-500 text-red-500" : "text-gray-700 group-hover:text-gray-500"}`} />
                    </div>
                    <p className={`text-sm truncate ${selectedChatId === match.id ? "text-sky-400 font-medium" : "text-gray-500"}`}>{match.lastMessage}</p>
                  </div>
                </button>
              );
            })
        ) : ( <div className="text-center py-20 text-gray-600 font-medium">No matches yet.</div> )}
      </div>
    </div>
  );
};

const IndividualChat = ({ chat, onBack, currentUserId }) => {
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [modalData, setModalData] = useState({ isOpen: false, title: "", message: "" });
  const [viewImage, setViewImage] = useState(null); // For fullscreen image
  const scrollRef = useRef(null);
  const chatId = getChatId(currentUserId, chat?.id);

  useEffect(() => {
    if (!chat?.id) return;
    try {
        const statusRef = rtdbRef(realtimeDB, `status/${chat.id}`);
        const unsub = onValue(statusRef, (snap) => setUserStatus(snap.val()));
        return () => unsub();
    } catch (e) { console.error(e); }
  }, [chat?.id]);

  useEffect(() => {
    if (!chatId || chatId === 'invalid_chat') return;
    try {
        const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
        const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data(), isMe: d.data().senderId === currentUserId }))));
        return () => unsub();
    } catch (e) { console.error(e); }
  }, [chatId, currentUserId]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // UPDATE USAGE STATS
  const updateUsage = async () => {
      try {
          const today = new Date().toISOString().split('T')[0];
          const usageRef = doc(db, "users", currentUserId, "usage", "daily");
          await setDoc(usageRef, { date: today }, { merge: true });
          await updateDoc(usageRef, { messages: increment(1) });
      } catch (e) { console.error("Usage update error:", e); }
  };

  // CHECK LIMITS
  const checkMessageLimit = async () => {
    try {
        const userRef = doc(db, "users", currentUserId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const tier = (userData?.subscriptionTier || 'Free').toLowerCase();

        if (tier === 'platinum' || tier === 'gold') return true;

        if (tier === 'free') {
            setModalData({ isOpen: true, title: "Chat Locked 🔒", message: "Chat is a Premium feature. Upgrade to unlock!" });
            return false;
        }

        if (tier === 'weekly') {
            const today = new Date().toISOString().split('T')[0];
            const usageRef = doc(db, "users", currentUserId, "usage", "daily");
            const usageSnap = await getDoc(usageRef);
            
            if (usageSnap.exists() && usageSnap.data().date === today) {
                const msgs = usageSnap.data().messages || 0;
                if (msgs >= 30) {
                    setModalData({ isOpen: true, title: "Daily Limit Reached", message: "You've reached your 30 daily messages limit!" });
                    return false;
                }
            }
            return true;
        }
        return true;
    } catch (e) { console.error(e); return true; }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !chatId) return;
    if (!(await checkMessageLimit())) return;
    
    const text = messageText; 
    setMessageText(""); 

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), { 
        senderId: currentUserId, 
        recipientId: chat.id, 
        text, 
        type: "text", 
        createdAt: serverTimestamp() 
      });

      await setDoc(doc(db, "matches", chatId), { 
        lastMessage: text, 
        timestamp: serverTimestamp(),
        users: [currentUserId, chat.id],
        usersIncluded: {
            [currentUserId]: true,
            [chat.id]: true
        }
      }, { merge: true });

      updateUsage();

    } catch (e) { console.error(e); }
  };

  if (!chat) return null;

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden">
      <UpgradeModal isOpen={modalData.isOpen} onClose={() => setModalData({ ...modalData, isOpen: false })} title={modalData.title} message={modalData.message} />
      
      {/* Full Screen Image Modal */}
      <ImageModal src={viewImage} onClose={() => setViewImage(null)} />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 bg-black/50 backdrop-blur-xl border-b border-white/5 z-20 h-[80px]">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="md:hidden p-2.5 -ml-3 text-gray-400 hover:bg-zinc-900 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
            <div className="relative shrink-0">
                <img src={chat.avatarUrl} className="w-12 h-12 rounded-full object-cover border border-white/10" alt="" />
                {userStatus?.state === "online" && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>}
            </div>
            <div>
                <h2 className="font-bold text-white text-base leading-tight">{chat.name}</h2>
                <p className={`text-xs font-medium ${userStatus?.state === "online" ? "text-sky-400 animate-pulse" : "text-gray-500"}`}>{userStatus?.state === "online" ? "Online" : "Offline"}</p>
            </div>
        </div>
        <button className="p-2.5 text-gray-500 hover:bg-zinc-900 rounded-full transition-colors"><MoreVertical className="w-6 h-6" /></button>
      </div>

      {/* Messages View */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-4 bg-black overscroll-contain" ref={scrollRef}>
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-5 py-3.5 shadow-xl ${msg.isMe ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-[1.5rem] rounded-tr-none" : "bg-zinc-900 text-gray-100 rounded-[1.5rem] rounded-tl-none border border-white/5"}`}>
                
                {msg.type === "image" ? ( 
                   <div 
                      className="cursor-pointer overflow-hidden rounded-xl"
                      onClick={() => setViewImage(msg.content)}
                   >
                       <img 
                          src={msg.content} 
                          className="max-w-full rounded-lg object-contain bg-black/20" 
                          style={{ maxHeight: '300px' }}
                          alt="sent" 
                          loading="lazy"
                        />
                   </div>
                ) : ( 
                   <p className="leading-relaxed text-[15px] whitespace-pre-wrap">{msg.text}</p> 
                )}
                
                <div className={`text-[10px] mt-1.5 font-bold uppercase tracking-widest ${msg.isMe ? "text-white/60" : "text-gray-500"}`}>
                   {msg.createdAt ? msg.createdAt.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "..."}
                </div>
              </div>
            </div>
        ))}
      </div>

      {/* Input Bar - Simplified without image upload */}
      <div className="flex-shrink-0 p-4 bg-black/80 backdrop-blur-2xl border-t border-white/5">
        <div className="max-w-4xl mx-auto flex items-center gap-3 bg-zinc-900 border border-white/10 p-2 rounded-[2rem]">
          <input 
            type="text" 
            placeholder="Message..." 
            value={messageText} 
            onChange={(e) => setMessageText(e.target.value)} 
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-base text-white placeholder-gray-600 px-4" 
          />
          <button onClick={handleSend} disabled={!messageText.trim()} className={`p-3.5 rounded-full transition-all ${messageText.trim() ? "bg-gradient-to-br from-sky-400 to-blue-600 text-black shadow-lg" : "bg-zinc-800 text-gray-600"}`}>
             <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.directChat) {
      const person = location.state.directChat;
      
      if (person && person.id) {
          const newChat = {
            id: person.id,
            name: person.name || "User",
            avatarUrl: (person.images && person.images.length > 0) ? person.images[0] : "https://placehold.co/100",
            lastMessage: "Start chatting..." 
          };
          
          setSelectedChat(newChat);
          window.history.replaceState({}, document.title);
      }
    }
  }, [location]);
  
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-sky-500" /></div>;

  if (!currentUser) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center text-white">
              <p>Please log in to chat.</p>
          </div>
      );
  }

  return (
    <div className="fixed top-16 bottom-20 md:top-20 md:bottom-0 left-0 right-0 flex bg-black overflow-hidden font-inter">
        <style>{customStyles}</style>
        
        <div className={`h-full shrink-0 overflow-hidden ${selectedChat ? "hidden md:block w-full md:w-[350px] lg:w-[420px]" : "w-full md:w-[350px] lg:w-[420px]"}`}>
          <ChatList setSelectedChat={setSelectedChat} selectedChatId={selectedChat?.id} currentUserId={currentUser.uid} />
        </div>

        <div className={`h-full bg-black ${selectedChat ? "w-full flex md:flex-1" : "hidden md:flex md:flex-1 md:items-center md:justify-center"}`}>
          {selectedChat ? (
            <div className="w-full h-full"><IndividualChat chat={selectedChat} onBack={() => setSelectedChat(null)} currentUserId={currentUser.uid} /></div>
          ) : (
            <div className="text-center p-10 opacity-40">
                <Heart className="w-12 h-12 text-sky-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white uppercase">Select a match</h2>
            </div>
          )}
        </div>
    </div>
  );
}