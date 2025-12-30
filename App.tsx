
import React, { useState, useEffect } from 'react';
import ThreeBackground from './components/ThreeBackground';
import AuthForms from './components/AuthForms';
import ChatInterface from './components/ChatInterface';
import { User } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initial silent check to see if user is already logged in (cookies)
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        const userData = data.user;
        setUser(userData);
        localStorage.setItem('dc_user', JSON.stringify(userData));
      } catch (err) {
        // Not logged in or expired
        localStorage.removeItem('dc_user');
      } finally {
        setInitialized(true);
      }
    };

    checkAuth();

    // Listen for auth failure events from axios interceptor
    const handleAuthFailure = () => {
      setUser(null);
      localStorage.removeItem('dc_user');
    };

    window.addEventListener('auth-failure', handleAuthFailure);
    return () => window.removeEventListener('auth-failure', handleAuthFailure);
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem('dc_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    // Assuming backend might have logout or just clear on frontend
    try {
      // If there's a logout endpoint, call it
      // await api.post('/auth/logout');
    } catch {}
    setUser(null);
    localStorage.removeItem('dc_user');
  };

  if (!initialized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium animate-pulse">Initializing Neural Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-indigo-500/30">
      <ThreeBackground />
      
      {!user ? (
        <div className="h-screen w-full flex items-center justify-center p-4">
          <AuthForms onSuccess={handleLoginSuccess} />
        </div>
      ) : (
        <ChatInterface currentUser={user} onLogout={handleLogout} />
      )}
      
      {/* Decorative Overlays */}
      <div className="fixed inset-0 pointer-events-none border-[20px] border-black/10 z-[100] mix-blend-overlay"></div>
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 z-[101]"></div>
    </div>
  );
};

export default App;
