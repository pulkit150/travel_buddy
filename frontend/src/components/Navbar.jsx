// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useState } from 'react';
import TrustBadge from './TrustBadge';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, clearNotifications } = useSocket();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const unread = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">✈️</span>
            <span className="font-bold text-xl text-ocean-700 tracking-tight">TravelBuddy</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-600 hover:text-ocean-600 font-medium text-sm transition-colors">
              Explore Trips
            </Link>
            {user && (
              <>
                <Link to="/my-trips" className="text-slate-600 hover:text-ocean-600 font-medium text-sm transition-colors">
                  My Trips
                </Link>
                <Link to="/trips/create" className="btn-primary text-sm py-2 px-4">
                  + Create Trip
                </Link>

                {/* Notifications bell */}
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifs(!showNotifs); clearNotifications(); }}
                    className="relative p-2 text-slate-500 hover:text-ocean-600 transition-colors"
                  >
                    🔔
                    {unread > 0 && (
                      <span className="absolute top-0 right-0 bg-coral-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </button>
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-slate-100 font-semibold text-sm text-slate-700">Notifications</div>
                      {notifications.length === 0 ? (
                        <p className="p-4 text-sm text-slate-400 text-center">No new notifications</p>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={i} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50">
                            <p className="text-sm text-slate-700">{n.message}</p>
                            <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full font-medium ${
                              n.type === 'accepted' ? 'bg-green-100 text-green-700' :
                              n.type === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-ocean-100 text-ocean-700'
                            }`}>{n.type}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Avatar dropdown */}
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="avatar" className="w-9 h-9 rounded-full object-cover border-2 border-ocean-200" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-ocean-100 flex items-center justify-center text-ocean-700 font-bold text-sm">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <TrustBadge score={user.trustScore} small />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 z-50">
                      <Link to="/profile" className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-t-2xl" onClick={() => setMenuOpen(false)}>My Profile</Link>
                      <Link to="/profile/edit" className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Edit Profile</Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-coral-500 hover:bg-slate-50 rounded-b-2xl">Logout</button>
                    </div>
                  )}
                </div>
              </>
            )}
            {!user && (
              <>
                <Link to="/login" className="text-slate-600 hover:text-ocean-600 font-medium text-sm">Login</Link>
                <Link to="/signup" className="btn-primary text-sm py-2 px-4">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-slate-500" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 flex flex-col gap-3">
          <Link to="/" className="text-slate-700 font-medium" onClick={() => setMenuOpen(false)}>Explore Trips</Link>
          {user ? (
            <>
              <Link to="/my-trips" className="text-slate-700 font-medium" onClick={() => setMenuOpen(false)}>My Trips</Link>
              <Link to="/trips/create" className="text-slate-700 font-medium" onClick={() => setMenuOpen(false)}>+ Create Trip</Link>
              <Link to="/profile" className="text-slate-700 font-medium" onClick={() => setMenuOpen(false)}>My Profile</Link>
              <button onClick={handleLogout} className="text-left text-coral-500 font-medium">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-700 font-medium" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/signup" className="text-slate-700 font-medium" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
