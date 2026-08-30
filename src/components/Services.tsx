import { ClipboardList, BicepsFlexed, Activity, Dumbbell, Apple, Lightbulb } from 'lucide-react';

export default function Services() {
  const services = [
    {
      title: "Personalized Diet Plans",
      description: "At NutriCraft, our mission is to empower individuals to lead healthier lives through personalized nutrition",
      icon: <ClipboardList className="w-8 h-8 text-green-500" strokeWidth={1.5} />
    },
    {
      title: "Balance Body & Mind",
      description: "At NutriCraft, our mission is to empower individuals to lead healthier lives through personalized nutrition",
      icon: <BicepsFlexed className="w-8 h-8 text-green-500" strokeWidth={1.5} />
    },
    {
      title: "Weight Management Programs",
      description: "At NutriCraft, our mission is to empower individuals to lead healthier lives through personalized nutrition",
      icon: <Activity className="w-8 h-8 text-green-500" strokeWidth={1.5} />
    },
    {
      title: "Healthy Dily Life",
      description: "At NutriCraft, our mission is to empower individuals to lead healthier lives through personalized nutrition",
      icon: <Apple className="w-8 h-8 text-green-500" strokeWidth={1.5} />
    },
    {
      title: "Sports Nutrition",
      description: "At NutriCraft, our mission is to empower individuals to lead healthier lives through personalized nutrition",
      icon: <Dumbbell className="w-8 h-8 text-green-500" strokeWidth={1.5} />
    },
    {
      title: "Support & Motivation",
      description: "At NutriCraft, our mission is to empower individuals to lead healthier lives through personalized nutrition",
      icon: <Lightbulb className="w-8 h-8 text-green-500" strokeWidth={1.5} />
    }
  ];

  return (
    <section className="bg-[#F8FBFA] py-20 px-6 md:px-12 mt-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-8 bg-green-500"></div>
            <span className="text-green-500 font-medium text-sm tracking-wide">Our services</span>
            <div className="h-px w-8 bg-green-500"></div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Our Diet & Nutrition Services
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {services.map((service, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-gray-100 flex gap-6 hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0">
                {service.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative SVG placeholder for the lettuce icon on the right */}
      <div className="absolute right-10 top-1/2 opacity-20 pointer-events-none hidden lg:block">
         <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
         </svg>
      </div>
    </section>
  );
}
