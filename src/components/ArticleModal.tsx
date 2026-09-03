import React from 'react';
import { X, BookOpen, Clock, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface ArticleData {
  title: string;
  category: string;
  readTime: string;
  image: string;
  intro: string;
  sections: {
    heading: string;
    body: string;
    points?: string[];
  }[];
  keyTakeaway: string;
}

export default function ArticleModal({
  isOpen,
  onClose,
  article,
}: {
  isOpen: boolean;
  onClose: () => void;
  article: ArticleData | null;
}) {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
              <BookOpen size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">
                {article.category}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <Clock size={12} />
                <span>{article.readTime}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-700 font-medium">
                  <ShieldCheck size={13} className="text-green-600" /> Peer-Reviewed Dietetics
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          <div className="rounded-2xl overflow-hidden max-h-64 shadow-md">
            <img 
              src={article.image} 
              alt={article.title} 
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800&auto=format&fit=crop';
              }}
              className="w-full h-full object-cover" 
            />
          </div>

          <div>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#0B1E29] leading-tight">
              {article.title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mt-3 border-l-3 border-green-500 pl-4 py-1 italic bg-green-50/40 rounded-r-xl">
              {article.intro}
            </p>
          </div>

          <div className="space-y-6 pt-2">
            {article.sections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="font-serif-display text-lg font-bold text-slate-900">
                  {idx + 1}. {section.heading}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {section.body}
                </p>

                {section.points && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 mt-2">
                    {section.points.map((p, pIdx) => (
                      <div key={pIdx} className="text-xs text-slate-700 flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-green-600 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Key Takeaway Box */}
          <div className="p-5 rounded-2xl bg-[#0B1E29] text-white space-y-1.5 shadow-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-green-400">
              💡 Clinical Summary & Takeaway
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {article.keyTakeaway}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Ready to calibrate your daily nutrition targets?
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Back to Home
            </button>
            <Link
              to="/signup"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <span>Get My Plan</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
