import { FileText } from "lucide-react";

export interface FeatureCard {
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

interface FeatureCardsProps {
  isDarkBackground?: boolean;
}

export const FeatureCards: React.FC<FeatureCardsProps> = ({ isDarkBackground = false }) => {
  const featureCards: FeatureCard[] = [
    {
      title: "AI-Powered Generation",
      description: "Create tailored proposals in seconds, not hours",
      gradientFrom: "from-indigo-400",
      gradientTo: "to-purple-500"
    },
    {
      title: "Smart Templates",
      description: "Our AI adapts to your audience with the perfect tone and style",
      gradientFrom: "from-blue-400",
      gradientTo: "to-indigo-500"
    },
    {
      title: "Instant Delivery",
      description: "Send polished proposals directly to clients with a single click",
      gradientFrom: "from-purple-400",
      gradientTo: "to-pink-500"
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
                : 'bg-white border border-indigo-50 hover:border-indigo-200'
              }`}
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 
              bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo}`}
            >
              <FileText className="h-6 w-6 text-white" />
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