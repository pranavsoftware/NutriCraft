import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Leaf, User, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-xs border-b border-slate-100">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-green-600 font-bold text-2xl flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <Leaf className="w-5 h-5 text-green-600" strokeWidth={2.2} />
          </div>
          <span className="font-serif-display font-bold text-2xl tracking-tight text-[#0B1E29]">
            Nutri<span className="text-green-600">Craft</span>
          </span>
        </Link>
      </div>
      
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
        <Link to="/" className="hover:text-green-600 transition-colors">Home</Link>
        <Link to="/about" className="hover:text-green-600 transition-colors">About Us</Link>
        <a href="/#services" className="hover:text-green-600 transition-colors">Services</a>
        <a href="/#plans" className="hover:text-green-600 transition-colors">Diet Plans</a>
        <a href="/#contact" className="hover:text-green-600 transition-colors">Contact</a>
      </div>

      <div className="hidden md:flex items-center gap-4">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="py-2 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <LayoutDashboard size={14} className="text-green-600" />
              <span>Dashboard</span>
            </Link>
            <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-700 hover:text-green-600 py-2 px-3 transition-colors flex items-center gap-1.5"
            >
              <LogIn size={14} />
              <span>Log In</span>
            </Link>
            <Link
              to="/signup"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full font-medium text-xs transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        )}
      </div>
      
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden text-slate-800 p-1"
        aria-label="Toggle Navigation Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-6 flex flex-col gap-4 md:hidden shadow-lg animate-in slide-in-from-top-2">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-slate-800 font-medium">Home</Link>
          <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-slate-800 font-medium">About Us</a>
          <a href="#services" onClick={() => setMobileMenuOpen(false)} className="text-slate-800 font-medium">Services</a>
          
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-4 rounded-full bg-green-600 text-white font-medium text-center text-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 rounded-full border border-slate-300 text-slate-800 font-medium text-center text-sm"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-4 rounded-full bg-green-600 text-white font-medium text-center text-sm"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
