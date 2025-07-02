import { CalendarCheck, Clock, Users, Smartphone, BarChart3, CreditCard } from "lucide-react";

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
      title: "Smart Class Booking",
      description: "Members can book classes instantly through the mobile app or web platform. Real-time availability, waitlists, and automated confirmations.",
      gradientFrom: "from-green-600",
      gradientTo: "to-green-700",
      icon: <CalendarCheck className="h-6 w-6 text-white" />
    },
    {
      title: "Real-Time Scheduling",
      description: "Dynamic class schedules that update across all platforms instantly. Manage instructor assignments and capacity limits with ease.",
      gradientFrom: "from-blue-600",
      gradientTo: "to-blue-700",
      icon: <Clock className="h-6 w-6 text-white" />
    },
    {
      title: "Member Management CRM",
      description: "Complete member database with profiles, membership tracking, communication logs, and automated email campaigns.",
      gradientFrom: "from-green-600",
      gradientTo: "to-teal-600",
      icon: <Users className="h-6 w-6 text-white" />
    },
    {
      title: "Mobile App for Members",
      description: "Branded mobile app that members download to book classes, view schedules, and manage their membership on the go.",
      gradientFrom: "from-blue-600",
      gradientTo: "to-indigo-600",
      icon: <Smartphone className="h-6 w-6 text-white" />
    },
    {
      title: "Business Analytics",
      description: "Track revenue, member retention, class popularity, and performance metrics. Make data-driven decisions for your gym.",
      gradientFrom: "from-green-600",
      gradientTo: "to-teal-600",
      icon: <BarChart3 className="h-6 w-6 text-white" />
    },
    {
      title: "Payment Integration",
      description: "Seamless payment processing for memberships, classes, and services. Automated billing and payment tracking included.",
      gradientFrom: "from-blue-600",
      gradientTo: "to-indigo-600",
      icon: <CreditCard className="h-6 w-6 text-white" />
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className={`text-3xl font-bold mb-4 ${isDarkBackground ? 'text-white' : 'text-gray-900'}`}>
          Complete Gym Management Platform
        </h2>
        <p className={`text-lg max-w-3xl mx-auto ${isDarkBackground ? 'text-white/80' : 'text-gray-600'}`}>
          Everything you need to manage your fitness business, from member CRM to mobile apps. 
          Streamline operations and enhance member experience with our comprehensive platform.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featureCards.map((card, index) => (
          <div 
            key={index} 
            className={`p-6 rounded-lg shadow-md transition-all hover:shadow-lg hover:-translate-y-1
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
            <h3 className="text-xl font-semibold mb-3">
              {card.title}
            </h3>
            <p className={`leading-relaxed ${isDarkBackground ? "text-white/80" : "text-gray-600"}`}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureCards;