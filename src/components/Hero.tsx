import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="bg-white py-16 px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="text-green-600 font-semibold flex items-center gap-2 text-sm">
          <div className="w-1.5 h-5 bg-green-600 rounded-sm"></div>
          <span>Great Experience In Nutrition</span>
        </div>
        
        <h1 className="font-serif-display text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.15]">
          Personalized <span className="text-slate-900">Nutrition</span> <br />
          <span className="text-green-600">Solutions</span> for <span className="text-green-600">Healthier</span><br />
          Stronger Living
        </h1>
        
        <p className="text-slate-600 max-w-lg leading-relaxed text-sm md:text-base">
          We provide expert nutrition guidance, customized meal plans, and wellness programs
          designed to support long-term health, energy, and lifestyle balance.
        </p>
        
        <div className="flex flex-wrap gap-4 pt-4">
          <Link 
            to="/signup" 
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-7 py-3 rounded-full font-medium text-sm transition-all shadow-md shadow-green-600/20 hover:shadow-lg hover:shadow-green-600/30 flex items-center gap-2"
          >
            <span>Book A Consultation</span>
            <ArrowRight size={16} />
          </Link>
          
          <a 
            href="#services" 
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs px-7 py-3 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
          >
            <span>View Our Services</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
      
      <div className="relative">
        <div className="rounded-3xl overflow-hidden aspect-[4/3] md:aspect-auto md:h-[480px] shadow-lg shadow-slate-200/50">
          <img 
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000&auto=format&fit=crop" 
            alt="Woman smiling holding a green juice" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Hyper Best Award Badge */}
        <div className="absolute -bottom-4 -left-4 sm:bottom-6 sm:-right-4 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="font-bold text-xs uppercase tracking-wider text-slate-900">Certified Wellness</div>
            <div className="text-amber-500 text-xs mt-0.5">★★★★★ 4.9 Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}
