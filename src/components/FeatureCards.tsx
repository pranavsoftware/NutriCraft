import React, { useState } from 'react';
import ArticleModal, { ArticleData } from './ArticleModal';

const ARTICLES: ArticleData[] = [
  {
    title: "Balancing Body & Mind: The Gut-Brain Metabolic Axis",
    category: "Holistic Nutrition",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
    intro: "Over 90% of the body's serotonin is produced in the digestive tract. Discover how stabilizing blood glucose and feeding microbiome diversity directly elevates mental focus and emotional resilience.",
    sections: [
      {
        heading: "The Glycemic Rollercoaster & Mental Fatigue",
        body: "When meals are dominated by refined carbohydrates without sufficient fiber and protein, rapid blood sugar spikes trigger sharp insulin surges followed by reactive hypoglycemia—manifesting as brain fog, irritability, and sudden sugar cravings.",
        points: [
          "Pair every carb with a minimum of 20g lean protein and 5g soluble fiber.",
          "Prioritize complex whole grains (oats, quinoa, brown basmati) over ultra-processed flours."
        ]
      },
      {
        heading: "Microbiome Diversity & Neurotransmitter Production",
        body: "Gut bacteria ferment dietary fibers into short-chain fatty acids (SCFAs) like butyrate, which cross the blood-brain barrier to reduce neuro-inflammation and regulate cortisol levels.",
        points: [
          "Incorporate fermented foods daily (Greek yogurt, kefir, fermented curd, kimchi).",
          "Target 30+ distinct plant species across your weekly food log."
        ]
      }
    ],
    keyTakeaway: "Nutritional mental wellness is not about restriction—it's about fueling your cellular energy with balanced macronutrient pairings and consistent meal timing."
  },
  {
    title: "Healthy Daily Life: Defeating the Afternoon Energy Slump",
    category: "Daily Habits & Meal Prep",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1498837167333-2f14ac1cb38b?q=80&w=800&auto=format&fit=crop",
    intro: "Why do most high-achievers crash at 3:00 PM? Learn the science of circadian nutrient distribution and practical batch preparation routines that keep energy steady all day long.",
    sections: [
      {
        heading: "Circadian Insulin Sensitivity & Meal Distribution",
        body: "Human insulin sensitivity peaks in the morning and early afternoon, declining significantly after sunset. Eating 65-70% of your daily carbohydrates between 8:00 AM and 2:00 PM optimizes glycogen storage while avoiding nighttime fat accumulation.",
        points: [
          "Start your day with at least 30g of protein within 90 minutes of waking.",
          "Keep dinner lighter with lean proteins and fibrous green vegetables."
        ]
      },
      {
        heading: "The 30-Minute Batch Prep Matrix",
        body: "Sustainable nutrition requires reducing daily friction. By cooking bulk proteins (chicken, lentils, paneer) and precutting crisp vegetables twice per week, logging meals in NutriCraft takes under 15 seconds.",
        points: [
          "Prep 3 staple carbohydrate bases on Sunday (quinoa, sweet potatoes, brown rice).",
          "Store pre-portioned healthy fats (almonds, walnuts) in grab-and-go packs."
        ]
      }
    ],
    keyTakeaway: "Energy consistency comes from frontloading high-protein breakfast and lunchtime nutrition rather than relying on afternoon caffeine crutches."
  },
  {
    title: "Personalized Diet Plans: Why Generic Caloric Deficits Fail",
    category: "Metabolic Science",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop",
    intro: "Cutting calories drastically slows thyroid function and burns lean muscle mass. Learn how Mifflin-St Jeor metabolic calibration and macro ratios protect your resting metabolic rate.",
    sections: [
      {
        heading: "The Pitfall of Starvation Deficits",
        body: "When you cut daily calories by more than 20% below your TDEE, the body enters adaptive thermogenesis: resting metabolic rate drops by up to 400 kcal/day, and hunger hormones (ghrelin) skyrocket, leading to inevitable rebound weight gain.",
        points: [
          "Maintain a gentle, sustainable deficit of -350 to -400 kcal/day for fat loss.",
          "Keep protein intake at 1.8g to 2.2g per kg of target bodyweight to preserve lean muscle."
        ]
      },
      {
        heading: "The Power of Individualized Macro Splits",
        body: "Endurance athletes require 50-55% carbohydrates for glycogen replenishment, whereas sedentary desk workers with insulin resistance thrive on a 35% protein, 35% carb, 30% healthy fat distribution.",
        points: [
          "Calibrate your Mifflin-St Jeor targets directly in your NutriCraft Profile.",
          "Let the AI Meal Planner auto-generate delicious recipes that hit your exact targets."
        ]
      }
    ],
    keyTakeaway: "Long-term physique and wellness transformations are achieved by feeding your metabolism with optimal macronutrients, not starving it."
  }
];

export default function FeatureCards() {
  const [activeArticle, setActiveArticle] = useState<ArticleData | null>(null);

  return (
    <section className="bg-white py-16 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {ARTICLES.map((article, index) => (
          <div key={index} className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden group hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="h-52 overflow-hidden relative p-4 pb-0">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-7 left-7 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-slate-800 shadow-xs">
                  {article.category}
                </span>
              </div>
              <div className="p-6">
                <div className="text-xs text-slate-400 font-medium mb-1.5">{article.readTime}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2.5 leading-snug group-hover:text-green-700 transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                  {article.intro}
                </p>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button 
                type="button"
                onClick={() => setActiveArticle(article)}
                className="text-green-600 font-semibold text-xs sm:text-sm flex items-center gap-1.5 hover:text-green-800 transition-colors cursor-pointer py-1"
              >
                <span>Read Full Article</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Article Reader Modal */}
      <ArticleModal 
        isOpen={!!activeArticle} 
        onClose={() => setActiveArticle(null)} 
        article={activeArticle} 
      />
    </section>
  );
}
