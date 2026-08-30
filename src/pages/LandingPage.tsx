import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeatureCards from '../components/FeatureCards';
import AboutSection from '../components/AboutSection';
import Services from '../components/Services';
import VideoSection from '../components/VideoSection';
import BackgroundAnimation from '../components/common/BackgroundAnimation';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden relative">
      {/* Subtle, cute ambient wellness background animation */}
      <BackgroundAnimation />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <div id="plans">
          <FeatureCards />
        </div>
        <div id="about">
          <AboutSection />
        </div>
        <div id="services">
          <Services />
        </div>
        <div id="contact">
          <VideoSection />
        </div>
        
        {/* Footer */}
        <footer className="bg-[#0B1E29] text-white py-12 px-6 md:px-12 border-t border-white/10 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
            <div className="space-y-3">
              <div className="font-serif-display font-bold text-2xl text-white">
                Nutri<span className="text-green-500">Craft</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Personalized Nutrition Solutions for Healthier Stronger Living. Certified dietitian consultation & precision meal plans.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="/about" className="hover:text-green-400 transition-colors">About Us</a></li>
                <li><a href="#services" className="hover:text-green-400 transition-colors">Our Services</a></li>
                <li><a href="#plans" className="hover:text-green-400 transition-colors">Personalized Diet Plans</a></li>
                <li><a href="#contact" className="hover:text-green-400 transition-colors">Consultations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Client Portal</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="/login" className="hover:text-green-400 transition-colors">Client Login</a></li>
                <li><a href="/signup" className="hover:text-green-400 transition-colors">Create Account</a></li>
                <li><a href="/dashboard" className="hover:text-green-400 transition-colors">My Nutrition Dashboard</a></li>
                <li><a href="/forgot-password" className="hover:text-green-400 transition-colors">Account Recovery</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Newsletter</h4>
              <p className="text-xs text-slate-400 mb-3">Subscribe for weekly evidence-based nutrition tips.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-slate-400 flex-1 outline-none focus:border-green-500"
                />
                <button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2 text-xs font-semibold cursor-pointer">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} NutriCraft. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="/about" className="hover:text-slate-400">About Us</a>
              <a href="#" className="hover:text-slate-400">Privacy Policy</a>
              <a href="#" className="hover:text-slate-400">Terms of Service</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
