import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import api from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login' | 'register' | 'chat'

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setUser(JSON.parse(userStr));
      setView('chat');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setView('login');
  };

  return (
    <div className="app-container">
      {!user && view === 'login' && (
        <Login onSwitch={() => setView('register')} onLogin={(u) => { setUser(u); setView('chat'); }} />
      )}
      {!user && view === 'register' && (
        <Register onSwitch={() => setView('login')} onRegister={(u) => { setUser(u); setView('chat'); }} />
      )}
      {user && <Chat user={user} onLogout={handleLogout} />}
    </div>
  );
}
