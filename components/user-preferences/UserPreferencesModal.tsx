import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserProfile, hasCompletedOnboarding } from "@/services/userService";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StepRole } from "./StepRole";
import { StepIndustry } from "./StepIndustry";
import { StepCompanySize } from "./StepCompanySize";
import { StepSpecializations } from "./StepSpecializations";
import { SummaryConfirmation } from "./SummaryConfirmation";
import { ExitConfirmation } from "./ExitConfirmation";
import { UserPreferencesData } from "./types";
import toast from 'react-hot-toast';

export default function UserPreferencesModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Use a single state object for all form data
  const [formData, setFormData] = useState<UserPreferencesData>({
    role: "",
    otherRole: "",
    industry: "",
    otherIndustry: "",
    companySize: "",
    specializations: [],
  });

  // Update form data partially
  const updateFormData = (updates: Partial<UserPreferencesData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };
  
  // Check if we need to show the modal
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;
      
      try {
        const completed = await hasCompletedOnboarding(user.uid);
        if (!completed) {
          setOpen(true);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };
    
    checkOnboardingStatus();
  }, [user]);
  
  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);

    toast.success(
      "Preferences saved! You can update them any time in Account Settings.",
      {
        duration: 3000,
      }
    );
    
    try {
      const finalRole = formData.role === "other" ? formData.otherRole : formData.role;
      const finalIndustry = formData.industry === "other" ? formData.otherIndustry : formData.industry;

      await saveUserProfile(user.uid, {
        role: finalRole,
        industry: finalIndustry,
        specializations: formData.specializations,
        email: user.email || "",
        onboardingCompleted: true,
      });

      // Find the user's business
      const businessesRef = collection(db, "businesses");
      const q = query(businessesRef, where("owners", "array-contains", user.uid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const businessDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "businesses", businessDoc.id), {
          companySize: formData.companySize,
          updatedAt: new Date().toISOString()
        });
      }

      setSummaryModalOpen(false);
      setOpen(false);
    } catch (error) {
      console.error("Error saving user preferences:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const goToNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };
  
  const goToPrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && currentStep < 3) {
      setConfirmDialogOpen(true);
      return;
    }
    setOpen(isOpen);
  };
  
  const handleCancelExit = () => {
    setConfirmDialogOpen(false);
  };
  
  const handleConfirmExit = () => {
    setConfirmDialogOpen(false);
    setOpen(false);
  };

  const showSummary = () => {
    setSummaryModalOpen(true);
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepRole 
            data={formData} 
            updateData={updateFormData} 
            onNext={goToNextStep} 
          />
        );
      case 1:
        return (
          <StepIndustry 
            data={formData} 
            updateData={updateFormData} 
            onNext={goToNextStep} 
            onBack={goToPrevStep} 
          />
        );
      case 2:
        return (
          <StepCompanySize 
            data={formData} 
            updateData={updateFormData} 
            onNext={goToNextStep} 
            onBack={goToPrevStep} 
          />
        );
      case 3:
        return (
          <StepSpecializations 
            data={formData} 
            updateData={updateFormData} 
            onNext={showSummary} 
            onBack={goToPrevStep} 
          />
        );
      default:
        return null;
    }
  };
  
  const renderProgressDots = () => {
    return (
      <div className="flex justify-center gap-2 my-4">
        {[0, 1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-2 w-2 rounded-full ${
              currentStep === step ? "bg-[#141E33]" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[450px] p-6 bg-white rounded-xl flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-[#141E33]">
              Welcome to ProspectsEasy
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Help us tailor your proposals to your industry and expertise
            </DialogDescription>
          </DialogHeader>
          
          {renderProgressDots()}
          
          <div className="overflow-y-auto px-6 py-4 flex-1">
            {renderStepContent()}
          </div>
        </DialogContent>
      </Dialog>

      <SummaryConfirmation 
        open={summaryModalOpen}
        onOpenChange={setSummaryModalOpen}
        data={formData}
        onSubmit={handleSubmit}
        onEdit={() => setSummaryModalOpen(false)}
        loading={loading}
      />

      <ExitConfirmation 
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onContinue={handleCancelExit}
        onExit={handleConfirmExit}
      />
    </>
  );
}