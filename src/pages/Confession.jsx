import React, { useState, useEffect } from "react";
import { Trash2, Edit2, User, ThumbsDown, ThumbsUp } from "lucide-react"; 
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  limit 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const customStyles = `
  /* Hide the scrollbar visually but keep functionality */
  ::-webkit-scrollbar {
    display: none;
  }
  html, body {
    -ms-overflow-style: none;
    scrollbar-width: none;
    background-color: black; /* Prevent white flash on scroll */
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ConfessionPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [confessions, setConfessions] = useState([]);
  const [newConfession, setNewConfession] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "confessions"),
      orderBy("createdAt", "desc"),
      limit(30) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedConfessions = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          likes: data.likedBy ? data.likedBy.length : 0,
          dislikes: data.dislikedBy ? data.dislikedBy.length : 0,
          liked: currentUser && data.likedBy ? data.likedBy.includes(currentUser.uid) : false,
          disliked: currentUser && data.dislikedBy ? data.dislikedBy.includes(currentUser.uid) : false,
        };
      });
      setConfessions(fetchedConfessions);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    return timestamp.toDate().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const postConfession = async () => {
    if (!newConfession.trim()) return;
    try {
      await addDoc(collection(db, "confessions"), {
        content: newConfession,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonymous",
        createdAt: serverTimestamp(),
        likedBy: [],
        dislikedBy: [],
      });
      setNewConfession("");
    } catch (error) {
      console.error(error);
    }
  };

  const toggleLike = async (id, currentLiked) => {
    const docRef = doc(db, "confessions", id);
    if (currentLiked) {
      await updateDoc(docRef, { likedBy: arrayRemove(currentUser.uid) });
    } else {
      await updateDoc(docRef, {
        likedBy: arrayUnion(currentUser.uid),
        dislikedBy: arrayRemove(currentUser.uid),
      });
    }
  };

  const toggleDislike = async (id, currentDisliked) => {
    const docRef = doc(db, "confessions", id);
    if (currentDisliked) {
      await updateDoc(docRef, { dislikedBy: arrayRemove(currentUser.uid) });
    } else {
      await updateDoc(docRef, {
        dislikedBy: arrayUnion(currentUser.uid),
        likedBy: arrayRemove(currentUser.uid),
      });
    }
  };

  return (
    <>
      <style>{customStyles}</style>

      {/* FIX: Changed 'min-h-screen' to a simple div with no height constraints.
          This allows the main page body to grow naturally with the content,
          eliminating the need for an inner scrollbar.
      */}
      <div className="w-full bg-black p-4 md:p-8 relative">
        
        <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-sky-400/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-blue-900/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="text-center mb-6 md:mb-8 animate-[slideIn_0.6s_ease-out] relative z-10">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent mb-2">
            Confessions
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Share your heart, find your people
          </p>
        </div>

        <div className="w-full mb-10 animate-[slideIn_0.5s_ease-out] relative z-10">
          <div className="max-w-4xl mx-auto bg-zinc-900/60 border border-white/5 backdrop-blur-sm rounded-3xl p-5 shadow-2xl">
            <textarea
              value={newConfession}
              onChange={(e) => setNewConfession(e.target.value)}
              placeholder="What's on your mind?"
              disabled={!currentUser}
              className="w-full p-4 bg-black/40 border border-zinc-800 rounded-2xl focus:border-sky-500 text-white outline-none resize-none text-base"
              rows="3"
            />
            <button
              onClick={postConfession}
              disabled={!currentUser}
              className="w-full mt-3 bg-gradient-to-r from-sky-400 to-blue-600 text-black py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Post Confession
            </button>
          </div>
        </div>

        <div className="w-full pb-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {confessions.map((confession, index) => (
              <div
                key={confession.id}
                className="bg-zinc-900/80 border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col group animate-[slideIn_0.5s_ease-out]"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-zinc-800">
                  <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400">
                    <User size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{confession.userName}</span>
                    <span className="text-[10px] text-gray-500 font-medium">{formatDate(confession.createdAt)}</span>
                  </div>
                </div>

                <p className="text-gray-200 mb-6 leading-relaxed flex-grow break-words text-[15px]">
                  {confession.content}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => toggleLike(confession.id, confession.liked)}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
                      confession.liked ? "bg-sky-500 text-black" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span className="font-bold">{confession.likes || 0}</span>
                  </button>

                  <button
                    onClick={() => toggleDislike(confession.id, confession.disliked)}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
                      confession.disliked ? "bg-red-500 text-white" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                    }`}
                  >
                    <ThumbsDown className="w-5 h-5" />
                    <span className="font-bold">{confession.dislikes || 0}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfessionPage;