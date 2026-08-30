import React, { useState, useRef } from 'react';
import { aiAnalyzerApi, journalApi } from '../../services/features';
import { 
  Camera, Upload, Sparkles, Check, AlertCircle, 
  Loader2, RefreshCw, Barcode
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalyzedFood {
  name: string;
  brand?: string;
  confidence?: number;
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function AiAnalyzerPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalyzedFood[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'photo' | 'barcode'>('photo');
  const [selectedSlot, setSelectedSlot] = useState('lunch');
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [loggedIndices, setLoggedIndices] = useState<Record<number, boolean>>({});
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setResults([]);
      setLoggedIndices({});
      setErrorMsg('');
      handleAnalyzePhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzePhoto = async (base64: string) => {
    try {
      setAnalyzing(true);
      setErrorMsg('');
      setLoggedIndices({});
      const res = await aiAnalyzerApi.analyze(base64);
      if (res.data.success) {
        setResults(res.data.foods || []);
        setIsSimulated(!!res.data.simulated);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Food analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      setAnalyzing(true);
      setErrorMsg('');
      setLoggedIndices({});
      const res = await aiAnalyzerApi.analyzeBarcode(barcodeInput.trim());
      if (res.data.success) {
        setResults(res.data.foods || []);
        setIsSimulated(!!res.data.simulated);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Barcode analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogToJournal = async (food: AnalyzedFood, index: number) => {
    try {
      setSavingIndex(index);
      await journalApi.addEntry({
        food_name: food.name,
        quantity_g: food.quantity_g,
        meal_type: selectedSlot,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        date: new Date().toISOString().slice(0, 10),
        source: 'ai_analyzer',
      });
      setLoggedIndices((prev) => ({ ...prev, [index]: true }));
      setSavedSuccess(`Logged "${food.name}" to your ${selectedSlot}!`);
      setTimeout(() => setSavedSuccess(null), 4000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Failed to log food.');
    } finally {
      setSavingIndex(null);
    }
  };

  const updateFoodField = (index: number, field: keyof AnalyzedFood, val: number | string) => {
    setResults((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="font-serif-display text-2xl font-bold text-[#0B1E29]">AI Vision Food Analyzer</h1>
            <p className="text-xs text-slate-500">Instant meal identification and macro breakdown powered by Gemini Vision</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => { setActiveTab('photo'); setErrorMsg(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-green-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Camera size={15} />
            <span>Food Photo Scan</span>
          </button>
          <button
            onClick={() => { setActiveTab('barcode'); setErrorMsg(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'barcode'
                ? 'bg-green-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Barcode size={15} />
            <span>Barcode Lookup</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-green-600" />
            <span>{savedSuccess}</span>
          </div>
          <button
            onClick={() => navigate('/dashboard/journal')}
            className="text-xs font-bold text-green-700 hover:underline cursor-pointer"
          >
            View Food Journal &rarr;
          </button>
        </div>
      )}

      {isSimulated && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <Sparkles size={14} className="text-amber-600 flex-shrink-0" />
          <span>Showing estimated demonstration data. Add your <strong>GEMINI_API_KEY</strong> to .env for live Gemini Vision neural analysis.</span>
        </div>
      )}

      {/* Input Area */}
      {activeTab === 'photo' ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="drop-zone p-10 text-center flex flex-col items-center justify-center space-y-3 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center shadow-xs">
                <Upload size={28} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-base">Click to upload meal photo</p>
                <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP up to 8MB</p>
              </div>
              <button
                type="button"
                className="mt-2 px-5 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors shadow-xs"
              >
                Choose Photo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden max-h-72 border border-slate-100 flex items-center justify-center bg-slate-900">
                <img
                  src={imagePreview}
                  alt="Meal Preview"
                  className="max-h-72 w-auto object-contain"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Retake / Change</span>
                </button>
              </div>

              {analyzing && (
                <div className="p-6 text-center space-y-3">
                  <Loader2 size={32} className="text-green-600 animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">Analyzing ingredients and nutritional density...</p>
                  <p className="text-xs text-slate-400">Gemini Vision is inspecting your photo</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Barcode Tab */
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="Enter product barcode digits (e.g. 8901030865421)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:border-green-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={analyzing || !barcodeInput.trim()}
              className="px-6 py-3 rounded-2xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Barcode size={16} />}
              <span>Scan Barcode</span>
            </button>
          </form>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif-display text-xl font-bold text-[#0B1E29]">Identified Food Items</h2>
              <p className="text-xs text-slate-400">Review & edit portions before logging directly to your food journal</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500">Meal Slot:</label>
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {results.map((food, idx) => {
              const isLogged = !!loggedIndices[idx];

              return (
                <div key={idx} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <input
                      type="text"
                      value={food.name}
                      onChange={(e) => updateFoodField(idx, 'name', e.target.value)}
                      className="font-bold text-base text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-green-600 outline-none flex-1"
                    />
                    {food.confidence && (
                      <span className="text-[11px] font-semibold text-green-700 bg-green-100/70 px-2.5 py-0.5 rounded-full w-fit shrink-0">
                        {Math.round(food.confidence * 100)}% Confidence
                      </span>
                    )}
                  </div>

                  {/* Macro Edit Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Portion (g)</label>
                      <input
                        type="number"
                        value={food.quantity_g}
                        disabled={isLogged}
                        onChange={(e) => updateFoodField(idx, 'quantity_g', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-amber-500">Calories (kcal)</label>
                      <input
                        type="number"
                        value={food.calories}
                        disabled={isLogged}
                        onChange={(e) => updateFoodField(idx, 'calories', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-blue-500">Protein (g)</label>
                      <input
                        type="number"
                        value={food.protein}
                        disabled={isLogged}
                        onChange={(e) => updateFoodField(idx, 'protein', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-emerald-500">Carbs (g)</label>
                      <input
                        type="number"
                        value={food.carbs}
                        disabled={isLogged}
                        onChange={(e) => updateFoodField(idx, 'carbs', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-purple-500">Fat (g)</label>
                      <input
                        type="number"
                        value={food.fat}
                        disabled={isLogged}
                        onChange={(e) => updateFoodField(idx, 'fat', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    {isLogged ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-default transition-all"
                      >
                        <Check size={14} className="stroke-[3]" />
                        <span>Done ✓ Logged to {selectedSlot}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLogToJournal(food, idx)}
                        disabled={savingIndex === idx}
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        {savingIndex === idx ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        <span>Confirm & Log to {selectedSlot}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
