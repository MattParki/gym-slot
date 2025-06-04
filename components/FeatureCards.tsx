import { CalendarCheck, Clock, Users } from "lucide-react";

export interface FeatureCard {
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  icon: React.ReactNode;
}

interface FeatureCardsProps {
  isDarkBackground?: boolean;
}

export const FeatureCards: React.FC<FeatureCardsProps> = ({ isDarkBackground = false }) => {
  const featureCards: FeatureCard[] = [
    {
      title: "Easy Slot Booking",
      description: "Reserve your gym sessions in just a few taps. No more waiting or uncertainty—secure your spot instantly.",
      gradientFrom: "from-green-400",
      gradientTo: "to-blue-500",
      icon: <CalendarCheck className="h-6 w-6 text-white" />
    },
    {
      title: "Real-Time Availability",
      description: "See live slot availability and avoid overcrowding. Plan your workouts with confidence and flexibility.",
      gradientFrom: "from-blue-400",
      gradientTo: "to-cyan-500",
      icon: <Clock className="h-6 w-6 text-white" />
    },
    {
      title: "Member & Staff Friendly",
      description: "Designed for both gym members and staff. Manage bookings, view schedules, and keep everyone in sync.",
      gradientFrom: "from-green-500",
      gradientTo: "to-teal-400",
      icon: <Users className="h-6 w-6 text-white" />
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featureCards.map((card, index) => (
          <div 
            key={index} 
            className={`p-6 rounded-lg shadow-md transition-all
              ${isDarkBackground 
                ? 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/15' 
                : 'bg-white border border-green-50 hover:border-green-200'
              }`}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 
              bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo}`}
            >
              {card.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {card.title}
            </h3>
            <p className={isDarkBackground ? "text-white/80" : "text-gray-600"}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureCards;