import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, CheckCircle, Star, ShieldCheck, ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
}

export default function AuthLayout({ children, title, subtitle, badge }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between text-slate-800 antialiased selection:bg-green-100 selection:text-green-800">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-40 shadow-xs">
        <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-[1.01]">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shadow-xs group-hover:bg-green-100 transition-colors">
            <Leaf className="w-6 h-6 text-green-600" strokeWidth={2.2} />
          </div>
          <div className="font-serif-display font-bold text-2xl tracking-tight text-[#0B1E29]">
            Nutri<span className="text-green-600">Craft</span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs md:text-sm font-medium text-slate-600 hover:text-green-600 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 lg:p-12 relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-green-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-100/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          
          {/* Left Wellness Showcase Panel (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#0B1E29] via-[#0e2735] to-[#08151c] text-white p-10 flex-col justify-between relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-green-400 text-xs font-semibold backdrop-blur-md mb-6 border border-white/10">
                <Leaf size={14} className="text-green-400" />
                <span>Personalized Nutrition & Diet</span>
              </div>

              <h2 className="font-serif-display text-3xl font-bold leading-tight mb-4 text-white">
                Empowering Your Health Journey with <span className="text-green-400">NutriCraft</span>
              </h2>

              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                Access personalized diet plans, smart nutrition analytics, meal logging, and certified wellness advice designed for sustainable vitality.
              </p>

              <div className="space-y-3.5 text-sm text-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                    <CheckCircle size={14} />
                  </div>
                  <span>Real-time micronutrient & macro tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                    <CheckCircle size={14} />
                  </div>
                  <span>Expert dietitian verified diet recommendations</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                    <CheckCircle size={14} />
                  </div>
                  <span>Secure, private & encrypted health records</span>
                </div>
              </div>
            </div>

            {/* Testimonial & Trust Rating Box */}
            <div className="pt-8 border-t border-white/10 mt-6">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex text-amber-400 gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-green-400 bg-green-950/60 px-2 py-0.5 rounded-full border border-green-800">
                    4.9 / 5 Rating
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic mb-3">
                  "NutriCraft transformed how I balance my daily nutrition. The personalized guidance is effortless and impactful."
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck size={14} className="text-green-400" />
                  <span>Trusted by 1,200+ healthy individuals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content / Form Area */}
          <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
            <div className="max-w-md w-full mx-auto">
              {badge && (
                <div className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full mb-3 border border-green-200">
                  {badge}
                </div>
              )}
              
              <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#0B1E29] mb-2">
                {title}
              </h1>
              
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                {subtitle}
              </p>

              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        <p>&copy; {new Date().getFullYear()} NutriCraft Dietitian & Wellness. All rights reserved.</p>
      </footer>
    </div>
  );
}
