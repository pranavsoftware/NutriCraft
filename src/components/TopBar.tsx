import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TopBar() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="bg-[#0B1E29] text-white py-2 px-6 md:px-12 flex justify-between items-center text-xs">
      <div className="font-medium text-slate-300 flex items-center gap-2">
        <Sparkles size={13} className="text-green-400" />
        <span>Welcome to NutriCraft &mdash; Personalized Nutrition & Wellness</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="hidden sm:flex gap-3 text-slate-400">
          <a href="#" aria-label="Facebook" className="hover:text-green-400 transition-colors"><Facebook size={14} /></a>
          <a href="#" aria-label="Instagram" className="hover:text-green-400 transition-colors"><Instagram size={14} /></a>
          <a href="#" aria-label="Twitter" className="hover:text-green-400 transition-colors"><Twitter size={14} /></a>
          <a href="#" aria-label="LinkedIn" className="hover:text-green-400 transition-colors"><Linkedin size={14} /></a>
        </div>

        <div className="flex items-center gap-3 text-slate-300">
          {isAuthenticated && user ? (
            <Link to="/dashboard" className="hover:text-green-400 font-medium transition-colors">
              My Portal ({user.name})
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hover:text-green-400 transition-colors">Client Login</Link>
              <span>&bull;</span>
              <Link to="/signup" className="text-green-400 hover:text-green-300 font-semibold transition-colors">Register</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
