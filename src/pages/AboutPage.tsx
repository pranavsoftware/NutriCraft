import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CaseStudyModal from '../components/CaseStudyModal';
import BackgroundAnimation from '../components/common/BackgroundAnimation';
import { 
  Leaf, Award, ShieldCheck, HeartPulse, Sparkles, 
  Users, CheckCircle2, ArrowRight, Activity, BookOpen, Star
} from 'lucide-react';

export default function AboutPage() {
  const [caseStudyOpen, setCaseStudyOpen] = useState(false);

  const team = [
    {
      name: 'Dr. Elena Rostova, RD, PhD',
      role: 'Head of Clinical Nutrition & Dietetics',
      bio: 'Former clinical researcher at Johns Hopkins with 14+ years specializing in glycemic balance, PCOS reversal, and metabolic longevity.',
      image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop'
    },
    {
      name: 'Marcus Vance, MS, CSCS',
      role: 'Director of Performance & Sports Metabolism',
      bio: 'Olympic strength & conditioning consultant focused on hypertrophy macronutrient timing and non-restrictive body recomposition.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80'
    },
    {
      name: 'Dr. Ananya Sharma, MD',
      role: 'Medical Advisor & Gut Microbiome Specialist',
      bio: 'Gastroenterology specialist focused on prebiotic gut flora diversity, food intolerance diagnostics, and IBS elimination protocols.',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80'
    }
  ];

  const pillars = [
    {
      icon: <HeartPulse className="w-8 h-8 text-green-600" />,
      title: 'Evidence-Based Dietology',
      desc: 'No arbitrary detoxes or crash diets. Every target is grounded in Mifflin-St Jeor metabolic science and peer-reviewed clinical literature.'
    },
    {
      icon: <Sparkles className="w-8 h-8 text-green-600" />,
      title: 'Multimodal AI Vision Intelligence',
      desc: 'Seamless food scanning and barcode lookup via Google Gemini neural vision and Open Food Facts with automatic macro extraction.'
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-green-600" />,
      title: 'Individualized Biometrics',
      desc: 'Every plan calibrates for age, gender, height, current weight, activity tier, dietary preferences, and verified food allergies.'
    },
    {
      icon: <Activity className="w-8 h-8 text-green-600" />,
      title: 'Sustainable Habit Evolution',
      desc: 'We engineer habit loops that adapt to your travel, social dining, and busy work schedules rather than forcing rigid restrictions.'
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden relative">
      <BackgroundAnimation />
      <div className="relative z-10">
        <Navbar />

      {/* Hero Banner */}
      <section className="bg-[#0B1E29] text-white py-20 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold uppercase tracking-wider">
            <Leaf size={13} />
            <span>Founded in 2020 • Science First</span>
          </div>

          <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Empowering Healthier Lives Through <br />
            <span className="text-green-400">Personalized Precision Nutrition</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            NutriCraft began with a single mission: to replace generic fad diets with tailored metabolic intelligence, certified clinical dietetics, and real-time smart food analysis.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              to="/signup"
              className="bg-green-600 hover:bg-green-700 text-white px-7 py-3 rounded-full font-semibold text-sm transition-all shadow-lg shadow-green-600/30 flex items-center gap-2"
            >
              <span>Get Started Today</span>
              <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => setCaseStudyOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-7 py-3 rounded-full font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen size={16} />
              <span>Explore Case Studies</span>
            </button>
          </div>
        </div>
      </section>

      {/* Story & Philosophy Section */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-green-600 rounded-full"></div>
            <span className="text-xs uppercase font-bold tracking-wider text-green-700">Our Founding Story</span>
          </div>

          <h2 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0B1E29] leading-tight">
            Why Generic Nutrition Guidelines Fail 90% of People
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Most diets fail because they treat human metabolism as a one-size-fits-all formula. Two individuals of the exact same weight can have wildly different insulin sensitivities, microbiome compositions, gut transit times, and circadian lifestyle demands.
          </p>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            At NutriCraft, our multidisciplinary team of certified clinical dietitians, sports biochemists, and AI engineers built a platform that dynamically adapts to your biological feedback—turning daily eating into a simple, enjoyable, and sustainable ritual.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="font-serif-display text-3xl font-bold text-green-700">1,200+</div>
              <div className="text-xs text-slate-500 mt-0.5">Active Clients</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <div className="font-serif-display text-3xl font-bold text-green-700">98.4%</div>
              <div className="text-xs text-slate-500 mt-0.5">Goal Attainment</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center col-span-2 sm:col-span-1">
              <div className="font-serif-display text-3xl font-bold text-green-700">4.9★</div>
              <div className="text-xs text-slate-500 mt-0.5">Client Rating</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 relative">
          <div className="row-span-2 rounded-3xl overflow-hidden shadow-xl">
            <img 
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop" 
              alt="Healthy nutrition consultation"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-3xl overflow-hidden shadow-lg h-52">
            <img 
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop" 
              alt="Fresh organic food"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-3xl overflow-hidden shadow-lg h-52">
            <img 
              src="https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=800&auto=format&fit=crop" 
              alt="Salad and nutrition prep"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="bg-[#F8FBFA] py-20 px-6 md:px-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-green-700">The NutriCraft Standard</span>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0B1E29]">
              Our Core Scientific Principles
            </h2>
            <p className="text-slate-600 text-sm">
              We uphold the highest clinical standards in every recommendation, plan, and AI analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, index) => (
              <div key={index} className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                  {pillar.icon}
                </div>
                <h3 className="font-serif-display font-bold text-lg text-[#0B1E29]">{pillar.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-green-700">Clinical Leadership</span>
          <h2 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#0B1E29]">
            Meet Our Dietitians & Health Specialists
          </h2>
          <p className="text-slate-600 text-sm">
            Decades of combined clinical experience at top health institutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <div key={index} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <div className="h-64 overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 space-y-3">
                <h3 className="font-serif-display font-bold text-lg text-[#0B1E29]">{member.name}</h3>
                <div className="text-xs font-semibold text-green-700">{member.role}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto mb-16">
        <div className="bg-[#0B1E29] text-white p-8 sm:p-12 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="space-y-3 max-w-lg">
            <h3 className="font-serif-display text-2xl sm:text-3xl font-bold">
              Ready to Upgrade Your Nutrition?
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm">
              Create your account in 30 seconds to calibrate your Mifflin-St Jeor metabolic targets and generate your 7-day custom meal plan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/signup"
              className="bg-green-600 hover:bg-green-700 text-white px-7 py-3 rounded-full font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => setCaseStudyOpen(true)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Case Studies</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B1E29] text-white py-12 px-6 md:px-12 border-t border-white/10">
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
              <li><Link to="/about" className="hover:text-green-400 transition-colors">About Us</Link></li>
              <li><a href="/#services" className="hover:text-green-400 transition-colors">Our Services</a></li>
              <li><a href="/#plans" className="hover:text-green-400 transition-colors">Personalized Diet Plans</a></li>
              <li><button onClick={() => setCaseStudyOpen(true)} className="hover:text-green-400 transition-colors cursor-pointer text-left">Clinical Case Studies</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wider">Client Portal</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/login" className="hover:text-green-400 transition-colors">Client Login</Link></li>
              <li><Link to="/signup" className="hover:text-green-400 transition-colors">Create Account</Link></li>
              <li><Link to="/dashboard" className="hover:text-green-400 transition-colors">My Nutrition Dashboard</Link></li>
              <li><Link to="/forgot-password" className="hover:text-green-400 transition-colors">Account Recovery</Link></li>
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
            <Link to="/about" className="hover:text-slate-400">About Us</Link>
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
          </div>
        </div>
      </footer>

        {/* Case Studies Modal */}
        <CaseStudyModal isOpen={caseStudyOpen} onClose={() => setCaseStudyOpen(false)} />
      </div>
    </div>
  );
}
