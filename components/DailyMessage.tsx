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
        return "Start the week strong! Check your class bookings and set the tone for a productive week at your gym.";
      case "tuesday":
        return "Keep the energy up! Review your schedule and make sure all your slots are filled.";
      case "wednesday":
        return "Mid-week check: Are your peak hours covered? Adjust your bookings for maximum efficiency.";
      case "thursday":
        return "Almost the weekend! Confirm your upcoming classes and send reminders to your members.";
      case "friday":
        return "Finish the week on a high note. Review your bookings and prep for a busy weekend at the gym.";
      case "saturday":
        return "Weekend rush! Monitor your class attendance and keep your members motivated.";
      case "sunday":
        return "Plan ahead for next week. Review your bookings and open new slots for your members.";
      default:
        return "Manage your gym bookings easily and keep your classes running smoothly with Gym Slot.";
    }
  }, [day]);

  return (
    <p className={`text-lg md:text-xl text-gray-600 mt-2 ${className}`}>
      {message}
    </p>
  );
}