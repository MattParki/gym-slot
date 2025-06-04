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
        return "Start the week strong!";
      case "tuesday":
        return "Keep the energy up!";
      case "wednesday":
        return "Mid-week check-in.";
      case "thursday":
        return "Almost the weekend!";
      case "friday":
        return "Finish the week strong.";
      case "saturday":
        return "Weekend rush!";
      case "sunday":
        return "Plan ahead for next week.";
      default:
        return "Manage your gym bookings with Gym Slot.";
    }
  }, [day]);

  return (
    <p className={`text-lg md:text-xl text-gray-600 mt-2 ${className}`}>
      {message}
    </p>
  );
}