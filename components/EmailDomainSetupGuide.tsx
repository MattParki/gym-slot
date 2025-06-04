"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Mail } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function EmailDomainSetupGuide() {
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [progress] = useState(0); // Set to 0 since it's a coming soon feature
  const [collapsed, setCollapsed] = useState(false); // Add collapsed state

  const steps = [
    {
      id: "configure-dns",
      title: "Configure DNS settings",
      description: "Set up the necessary DNS records to verify your domain ownership.",
      comingSoon: true
    },
    {
      id: "verify-domain",
      title: "Verify your domain",
      description: "Complete the domain verification process to prove ownership.",
      comingSoon: true
    },
    {
      id: "setup-spf",
      title: "Set up SPF and DKIM",
      description: "Configure email authentication protocols for better deliverability.",
      comingSoon: true
    },
    {
      id: "test-sending",
      title: "Test email sending",
      description: "Verify your domain configuration is working correctly.",
      comingSoon: true
    }
  ];

  const toggleStep = (stepId: string) => {
    if (openStepId === stepId) {
      setOpenStepId(null);
    } else {
      setOpenStepId(stepId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Mail className="h-5 w-5 text-blue-500 hidden md:block" />
          <h2 className="text-xl font-bold">Set up your custom email domain</h2>
        </div>
        <div className="flex items-center w-full md:w-auto">
          <span className="text-sm font-medium mr-2">{progress}%</span>
          <Progress value={progress} className="h-2 w-full md:w-24" />
          
          {/* Add collapse button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2"
            aria-label={collapsed ? "Expand email domain setup guide" : "Collapse email domain setup guide"}
            onClick={() => setCollapsed(!collapsed)}
           >
            {collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
           </Button>
        </div>
      </div>

      <div className="mt-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="font-semibold text-lg">Coming Soon</div>
          <span className="inline-flex items-center rounded-md bg-indigo-50 text-indigo-700 px-2 py-1 text-xs font-medium">
            Feature Preview
          </span>
        </div>
        <p className="text-gray-600 mt-1">
          This feature will be available when the app launches
        </p>
      </div>
      
      <div className="text-sm text-gray-500 mb-6 flex items-center">
        <span>{steps.length} steps</span>
        <span className="mx-2">•</span>
        <span>About 15 min</span>
      </div>
      
      {/* Only show steps if not collapsed */}
      {!collapsed && (
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className="border rounded-lg overflow-hidden transition-all border-gray-200"
            >
              <div 
                className="flex flex-wrap items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleStep(step.id)}
              >
                <div className="flex items-center gap-3 mb-2 md:mb-0 w-full md:w-auto">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-300 text-gray-500 flex-shrink-0">
                    <span className="text-sm">{index + 1}</span>
                  </div>
                  <h3 className="font-medium">
                    {step.title}
                  </h3>
                </div>
                <div className="flex items-center w-full md:w-auto justify-between md:justify-start">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Coming Soon</span>
                  <div className="flex items-center">
                    {openStepId === step.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 ml-2" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 ml-2" />
                    )}
                  </div>
                </div>
              </div>
              
              {openStepId === step.id && (
                <div className="px-4 pb-4">
                  <p className="text-gray-600 ml-9 mb-4">{step.description}</p>
                  
                  {/* If we add buttons/actions in expanded sections later */}
                  <div className="flex flex-wrap justify-start ml-9">
                    {/* Any buttons would go here with the same wrapping pattern */}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}