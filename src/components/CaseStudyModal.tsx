import React, { useState } from 'react';
import { X, CheckCircle, TrendingUp, Award, Clock, ArrowRight, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CaseStudy {
  id: string;
  tag: string;
  client: string;
  age: number;
  duration: string;
  title: string;
  problem: string;
  strategy: string[];
  metrics: { label: string; value: string; sub: string }[];
  quote: string;
  image: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'pcos-metabolism',
    tag: 'Metabolic & Hormonal Health',
    client: 'Priya M.',
    age: 29,
    duration: '16 Weeks',
    title: 'Reversing Pre-Diabetes & PCOS Insulin Resistance',
    problem: 'Struggled with irregular glucose spikes, stubborn visceral weight, and afternoon energy crashes on low-calorie fad diets.',
    strategy: [
      'Engineered a 40% low-GI carbohydrate, 30% high-protein, 30% anti-inflammatory fat protocol.',
      'Synchronized eating windows around circadian insulin sensitivity (8 AM - 7 PM).',
      'Daily AI vision logging to maintain a consistent 35g fiber threshold.'
    ],
    metrics: [
      { label: 'HbA1c Level', value: '5.9% → 5.1%', sub: 'Pre-diabetes reversed' },
      { label: 'Body Composition', value: '-8.5 kg', sub: 'Visceral fat normalized' },
      { label: 'Daily Energy', value: '9/10 Score', sub: 'Zero afternoon slumps' }
    ],
    quote: 'NutriCraft changed how I view food. Instead of starving myself, I ate delicious, nutrient-dense meals and my blood work is completely healthy.',
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'hypertrophy-cut',
    tag: 'Sports Nutrition & Leaning',
    client: 'Alex K.',
    age: 34,
    duration: '12 Weeks',
    title: 'Lean Muscle Hypertrophy with Precision Macronutrients',
    problem: 'Experienced gym plateaus, chronic muscle soreness, and digestive bloating on generic high-protein meal shakes.',
    strategy: [
      'Tailored a Mifflin-St Jeor surplus of +250 kcal on training days with 2.2g/kg lean protein.',
      'Shifted to bioavailable whole food sources (chicken breast, salmon, Greek yogurt, quinoa).',
      'Hydration and electrolyte timing pre/post heavy resistance workouts.'
    ],
    metrics: [
      { label: 'Body Fat %', value: '18.2% → 11.4%', sub: 'Lean muscle preserved' },
      { label: 'Bench Press 1RM', value: '+17.5 kg', sub: 'Strength PR surpassed' },
      { label: 'Recovery Rate', value: '< 24 hrs', sub: 'DOMS minimized' }
    ],
    quote: 'The precision meal plans and AI scanner made tracking effortless. I achieved the best athletic shape of my life in just 3 months.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: 'gut-health-longevity',
    tag: 'Digestive Longevity & Balance',
    client: 'Sarah L.',
    age: 42,
    duration: '20 Weeks',
    title: 'Resolving Chronic IBS & Restoring Gut Microbiome',
    problem: 'Severe digestive discomfort, nutrient malabsorption, and high stress from reactive elimination dieting.',
    strategy: [
      'Conducted a systematic 3-phase FODMAP reintroduction protocol guided by certified dietitians.',
      'Infused diverse prebiotic fibers (asparagus, oats, berries) and probiotic fermented kefir/curd.',
      'Integrated stress-reduction mindful eating protocols.'
    ],
    metrics: [
      { label: 'Symptom Relief', value: '94% Drop', sub: 'Bloating & pain eliminated' },
      { label: 'Diet Diversity', value: '45+ Foods', sub: 'Expanded from 12 items' },
      { label: 'Sleep Quality', value: '7.8 hrs/night', sub: 'Deep REM restored' }
    ],
    quote: 'Having real dietitians verify my meal plans gave me confidence. I can now eat out with my family without fear of digestive flare-ups.',
    image: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=800&auto=format&fit=crop'
  }
];

export default function CaseStudyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedStudy, setSelectedStudy] = useState<CaseStudy>(CASE_STUDIES[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
              <Award size={20} />
            </div>
            <div>
              <h3 className="font-serif-display font-bold text-xl text-[#0B1E29]">NutriCraft Clinical Case Studies</h3>
              <p className="text-xs text-slate-500">Real outcomes achieved through personalized, evidence-based dietetics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 p-4 bg-slate-100/60 border-b border-slate-100 overflow-x-auto">
          {CASE_STUDIES.map((study) => (
            <button
              key={study.id}
              onClick={() => setSelectedStudy(study)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStudy.id === study.id
                  ? 'bg-green-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {study.client} • {study.tag}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left Image & Client Card */}
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-md border border-slate-100">
                <img src={selectedStudy.image} alt={selectedStudy.client} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Client Profile:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <UserCheck size={13} className="text-green-600" />
                    {selectedStudy.client}, Age {selectedStudy.age}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Protocol Timeline:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <Clock size={13} className="text-amber-600" />
                    {selectedStudy.duration}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Focus Area:</span>
                  <span className="font-bold text-green-700">{selectedStudy.tag}</span>
                </div>
              </div>
            </div>

            {/* Right Details */}
            <div className="md:col-span-2 space-y-5">
              <div>
                <span className="text-[11px] font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  Documented Case History
                </span>
                <h4 className="font-serif-display text-xl font-bold text-slate-900 mt-2">
                  {selectedStudy.title}
                </h4>
              </div>

              {/* Problem */}
              <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100">
                <h5 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-1">Initial Challenge</h5>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedStudy.problem}</p>
              </div>

              {/* Strategy */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Clinical Nutrition Strategy</h5>
                <ul className="space-y-2">
                  {selectedStudy.strategy.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                      <CheckCircle size={15} className="text-green-600 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Verified Metrics */}
              <div>
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Measured Clinical Outcomes</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedStudy.metrics.map((m, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                      <div className="text-xs text-slate-500 font-medium">{m.label}</div>
                      <div className="text-lg font-bold text-emerald-800 my-0.5">{m.value}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">{m.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="p-4 rounded-2xl bg-[#0B1E29] text-white space-y-2">
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  "{selectedStudy.quote}"
                </p>
                <div className="text-[11px] font-bold text-green-400">
                  — {selectedStudy.client}, Verified NutriCraft Client
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Want to start your custom transformation?
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <Link
              to="/signup"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <span>Begin Consultation</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
