import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { companySizeOptions } from "@/models/UserProfile";
import { StepProps } from "./types";

export function StepCompanySize({ data, updateData, onNext, onBack }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-[#141E33] p-3">
          <FileText className="h-6 w-6 text-white" />
        </div>
      </div>
      <Label htmlFor="companySize" className="text-lg">Company Size</Label>
      <Select 
        value={data.companySize} 
        onValueChange={(value) => updateData({ companySize: value })}
      >
        <SelectTrigger className="mt-2 h-12">
          <SelectValue placeholder="How many employees?" />
        </SelectTrigger>
        <SelectContent>
          {companySizeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <div className="flex gap-3 mt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 h-12"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-12 bg-[#141E33] hover:bg-[#1f2c49] text-white"
          disabled={!data.companySize}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}