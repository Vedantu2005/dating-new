import React from 'react';
import { Flame, MessageCircle, Heart, User, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';

const customStyles = `
    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px rgba(14, 165, 233, 0.5)); }
        50% { opacity: 0.7; filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.8)); }
    }
`;

export default function Navbar() {
    const location = useLocation();
    const { currentUser } = useAuth();

    const navItems = [
        {
            id: 'discover',
            label: 'Discover',
            icon: Flame,
            color: 'from-sky-500 to-blue-700',
            hoverBg: 'hover:bg-sky-600/10',
            to: '/discover'
        },
        {
            id: 'confessions',
            label: 'Confessions',
            icon: MessageCircle,
            color: 'from-sky-500 to-blue-700',
            hoverBg: 'hover:bg-sky-600/10',
            to: '/confessions'
        },
        {
            id: 'chat',
            label: 'Chat',
            icon: Heart,
            color: 'from-sky-500 to-blue-700',
            hoverBg: 'hover:bg-sky-600/10',
            to: '/chat'
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: User,
            color: 'from-sky-500 to-blue-700',
            hoverBg: 'hover:bg-sky-600/10',
            to: '/profile'
        },
    ];

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <>
            <style>{customStyles}</style>

            {/* Desktop Navbar */}
            <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10 shadow-lg" style={{ animation: 'slideDown 0.5s ease-out' }}>
                <div className="max-w-7xl mx-auto px-6" >
                    <div className="flex items-center justify-between h-20">
                        {/* Logo Link to Profile */}
                        <Link to="/profile" className="flex items-center gap-3 cursor-pointer group">
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="h-14 w-auto object-contain"
                            />
                        </Link>

                        {/* Navigation Items */}
                        <div className="flex gap-4">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.to;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.id}
                                        to={item.to}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold transition-all transform duration-300 ${isActive
                                            ? `bg-gradient-to-r ${item.color} text-white shadow-[0_0_15px_rgba(14,165,233,0.3)] scale-105`
                                            : `text-gray-400 ${item.hoverBg} hover:text-sky-400`
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User Info & Logout */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-gray-400 tracking-wide border-r border-white/10 pr-4">
                                {currentUser?.displayName
                                    ? currentUser.displayName.split(' ')[0]
                                    : currentUser?.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-red-400 border border-red-500/20 rounded-xl hover:bg-gradient-to-r hover:from-red-500 hover:to-rose-600 hover:text-black transition-all duration-300 shadow-lg group"
                                title="Logout"
                            >
                                <span className="text-sm font-bold">Logout</span>
                                <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Top Bar */}
            <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10 shadow-md">
                <div className="flex items-center justify-center h-16 px-4">
                    <Link to="/profile" className="flex items-center gap-2">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="h-14 w-auto object-contain"
                        />
                    </Link>
                </div>
            </nav>

            {/* Mobile Bottom Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-white/10 z-50">
                <div className="grid grid-cols-4 gap-1 px-2 py-3">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.id}
                                to={item.to}
                                className={`flex flex-col items-center justify-center gap-1.5 py-2 rounded-2xl transition-all transform duration-300 ${isActive
                                    ? `bg-gradient-to-r ${item.color} scale-105 shadow-lg shadow-sky-500/10`
                                    : `text-gray-500`
                                    }`}
                            >
                                <Icon className={`w-6 h-6 ${isActive ? 'text-black' : 'text-sky-500/70'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-black' : 'text-gray-500'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}