"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MobileTooltipProps {
  content: React.ReactNode;
  className?: string;
  iconSize?: number;
}

export function MobileTooltip({ 
  content, 
  className = "text-muted-foreground", 
  iconSize = 16 
}: MobileTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Handle click for mobile devices
  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  // Use mouseenter/mouseleave for desktop devices 
  const handleMouseEnter = () => {
    // Only use hover on devices that support it
    if (window.matchMedia("(hover: hover)").matches) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    // Only use hover on devices that support it
    if (window.matchMedia("(hover: hover)").matches) {
      setIsOpen(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip open={isOpen}>
        <TooltipTrigger asChild onClick={handleClick}>
          <Info 
            size={iconSize} 
            className={`${className} cursor-pointer`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </TooltipTrigger>
        <TooltipContent onClick={() => setIsOpen(false)}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}