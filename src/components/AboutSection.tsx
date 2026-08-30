import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CaseStudyModal from './CaseStudyModal';

export default function AboutSection() {
  const [caseStudyOpen, setCaseStudyOpen] = useState(false);

  return (
    <section className="bg-white py-16 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      
      {/* Images Grid */}
      <div className="grid grid-cols-2 gap-4 relative">
        <div className="row-span-2 rounded-2xl overflow-hidden h-[500px]">
          <img 
            src="https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=800&auto=format&fit=crop" 
            alt="Woman with green smoothie" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="rounded-2xl overflow-hidden h-[240px]">
          <img 
            src="https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=800&auto=format&fit=crop" 
            alt="Healthy food bowl" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="rounded-2xl overflow-hidden h-[240px]">
          <img 
            src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop" 
            alt="Salad on desk" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Rating Badge */}
        <div className="absolute bottom-12 left-[-2rem] bg-green-500 text-white rounded-2xl p-4 shadow-xl w-32 hidden md:block">
           <div className="flex -space-x-2 mb-2">
             <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
               <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" alt="" className="w-full h-full object-cover" />
             </div>
             <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
               <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" alt="" className="w-full h-full object-cover" />
             </div>
             <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
               <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80" alt="" className="w-full h-full object-cover" />
             </div>
           </div>
           <div className="font-bold text-2xl">4.9</div>
           <div className="text-xs text-green-100">Happy rating</div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px w-8 bg-gray-300"></div>
          <span className="text-gray-500 font-medium text-sm tracking-wide">Founded In 2020 • NutriCraft</span>
        </div>
        
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
          At NutriCraft, our Mission<br />
          Is to Empower Individuals
        </h2>
        
        <p className="text-gray-600 leading-relaxed text-sm">
          At NutriCraft, our mission is to empower individuals to lead healthier lives through personalized nutrition and evidence-based dietology. We believe that the key to optimal health lies in understanding and addressing each person's unique metabolic profile.
        </p>
        
        <p className="text-gray-600 leading-relaxed text-sm">
          We envision a world where everyone has access to the clinical knowledge and AI tools necessary to make confident dietary choices without restrictive crash dieting.
        </p>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-8 py-4">
          <p className="text-gray-600 text-sm max-w-[250px] leading-relaxed">
            From crafting personalized nutrition strategies to supporting long-term lifestyle balance, we help individuals build healthier routines with clarity.
          </p>
          <div className="border-l border-gray-200 pl-8">
            <div className="text-4xl font-bold text-green-600 mb-1">1200+</div>
            <div className="text-gray-500 text-sm">Satisfied Clients</div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button 
            type="button"
            onClick={() => setCaseStudyOpen(true)}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-6 py-3 rounded-full font-semibold text-sm transition-all shadow-md shadow-green-600/20 hover:shadow-lg hover:shadow-green-600/30 flex items-center gap-2 cursor-pointer"
          >
            <span>Our Case Studies</span>
            <span aria-hidden="true">&rarr;</span>
          </button>

          <Link
            to="/about"
            className="text-gray-700 hover:text-green-600 border border-slate-200 hover:border-green-600 px-6 py-3 rounded-full font-semibold text-sm transition-colors"
          >
            Learn More About Us
          </Link>
        </div>
      </div>

      {/* Case Studies Modal */}
      <CaseStudyModal isOpen={caseStudyOpen} onClose={() => setCaseStudyOpen(false)} />
    </section>
  );
}
