import { 
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { roleOptions, companySizeOptions } from "@/models/UserProfile";
import { industryOptions } from "@/data/industryOptions";
import { SummaryProps } from "./types";

export function SummaryConfirmation({ open, onOpenChange, data, onSubmit, onEdit, loading }: SummaryProps) {
  const getOptionLabel = (options: {value: string, label: string}[], value: string) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const getRoleDisplay = () => {
    if (data.role === "other") return data.otherRole;
    return getOptionLabel(roleOptions, data.role);
  };

  const getIndustryDisplay = () => {
    if (data.industry === "other") return data.otherIndustry;
    return getOptionLabel(industryOptions, data.industry);
  };

  const getCompanySizeDisplay = () => {
    return getOptionLabel(companySizeOptions, data.companySize);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 bg-white rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#141E33]">
            Confirm Your Profile
          </DialogTitle>
          <DialogDescription className="pt-2">
            Please review your information before finalizing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-[#141E33]/10 p-4">
              <CheckCircle className="h-12 w-12 text-[#141E33]" />
            </div>
          </div>
          
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">{getRoleDisplay()}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Industry</p>
              <p className="font-medium">{getIndustryDisplay()}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Company Size</p>
              <p className="font-medium">{getCompanySizeDisplay()}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Specializations</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {data.specializations.map((specialization, index) => (
                  <span key={index} className="bg-[#141E33]/10 px-2 py-1 rounded-full text-sm">
                    {specialization}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex-1 sm:flex-auto"
          >
            Edit
          </Button>
          <Button
            onClick={onSubmit}
            className="flex-1 sm:flex-auto bg-[#141E33] hover:bg-[#1f2c49]"
            disabled={loading}
          >
            {loading ? "Saving..." : "Confirm & Finish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}