import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Loading from './components/Loading'; 
import { usePresence } from './usePresence';

// --- LAZY LOAD PAGES ---
const AuthPage = React.lazy(() => import('./components/Auth'));
const ForgotPasswordPage = React.lazy(() => import('./components/ForgotPassword'));
const DiscoverPage = React.lazy(() => import('./pages/Discover'));
const ConfessionsPage = React.lazy(() => import('./pages/Confession'));
const ChatPage = React.lazy(() => import('./pages/Chat'));
const ProfilePage = React.lazy(() => import('./pages/Profile'));
const PremiumPage = React.lazy(() => import('./pages/PremiumPage')); 

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

// --- PROTECTED ROUTE FOR REGULAR USERS ---
const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth(); 
    if (loading) return <Loading />;
    if (!currentUser) return <Navigate to="/" replace />;
    return children;
};

const AppRoutes = () => {
    const { currentUser } = useAuth();
    const location = useLocation(); // Get current route
    usePresence();

    // Hide Navbar on Admin route
    const isAdminRoute = location.pathname === '/admin';
    const showNavbar = currentUser && !isAdminRoute;

    return (
        <div className="min-h-screen bg-black text-white">
            {showNavbar && <Navbar />} 
            
            {/* Remove padding if Navbar is hidden */}
            <main className={showNavbar ? "pt-16 pb-20 md:pb-0 md:pt-20 transition-all duration-300 min-h-[calc(100vh-140px)]" : ""}> 
                <Suspense fallback={<Loading />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={!currentUser ? <AuthPage /> : <Navigate to="/discover" replace />} />
                        <Route path="/login" element={!currentUser ? <AuthPage /> : <Navigate to="/discover" replace />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                        {/* Regular User Protected Routes */}
                        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                        <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
                        <Route path="/confessions" element={<ProtectedRoute><ConfessionsPage /></ProtectedRoute>} />
                        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                        <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />

                        {/* --- ADMIN ROUTES --- */}
                        <Route path="/admin" element={<AdminDashboard />} />

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to={currentUser ? "/discover" : "/"} replace />} />
                    </Routes>
                </Suspense>
            </main>
        </div>
    );
};

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}