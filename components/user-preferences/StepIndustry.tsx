import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { industryOptions } from "@/data/industryOptions";
import { StepProps } from "./types";

export function StepIndustry({ data, updateData, onNext, onBack }: StepProps) {
  const handleIndustryChange = (value: string) => {
    updateData({ 
      industry: value,
      otherIndustry: value !== "other" ? "" : data.otherIndustry 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-[#141E33] p-3">
          <FileText className="h-6 w-6 text-white" />
        </div>
      </div>
      <Label htmlFor="industry" className="text-lg">What industry are you in?</Label>
      <Select value={data.industry} onValueChange={handleIndustryChange}>
        <SelectTrigger className="mt-2 h-12">
          <SelectValue placeholder="Select your industry" />
        </SelectTrigger>
        <SelectContent>
          {industryOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {data.industry === "other" && (
        <div className="mt-4">
          <Label htmlFor="otherIndustry">Please specify your industry</Label>
          <Input
            id="otherIndustry"
            value={data.otherIndustry}
            onChange={(e) => updateData({ otherIndustry: e.target.value })}
            placeholder="Enter your industry"
            className="mt-2"
          />
        </div>
      )}
      
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
          disabled={!data.industry || (data.industry === "other" && !data.otherIndustry)}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}