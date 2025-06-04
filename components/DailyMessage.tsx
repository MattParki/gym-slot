"use client";

import { useMemo } from "react";

interface DailyMessageProps {
  day: string;
  className?: string;
}

export default function DailyMessage({ day, className = "" }: DailyMessageProps) {
  const message = useMemo(() => {
    switch (day.toLowerCase()) {
      case "monday":
        return "Ready to win more clients? Use ProspectsEasy to create compelling proposals in seconds.";
      case "tuesday":
        return "Build on yesterday's momentum. Create proposals that stand out from the competition.";
      case "wednesday":
        return "Mid-week motivation! Turn prospects into clients with professional, AI-powered proposals.";
      case "thursday":
        return "Keep the momentum going! Your next successful client relationship is just one proposal away.";
      case "friday":
        return "Finish the week strong! Send out those winning proposals before the weekend.";
      case "saturday":
        return "Weekend productivity pays off. Take a few minutes to prepare proposals for next week's success.";
      case "sunday":
        return "Set yourself up for success. Plan your week and prepare your proposals to hit the ground running tomorrow.";
      default:
        return "Ready to win more clients? Use ProspectsEasy to create compelling proposals in seconds.";
    }
  }, [day]);

  return (
    <p className={`text-lg md:text-xl text-gray-600 mt-2 ${className}`}>
      {message}
    </p>
  );
}