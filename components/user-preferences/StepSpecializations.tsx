import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import SpecializationTagsInput from "@/components/SpecializationTagsInput";
import { StepProps } from "./types";

export function StepSpecializations({ data, updateData, onNext, onBack }: StepProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6 flex-1 overflow-y-auto pb-4">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-[#141E33] p-3">
            <FileText className="h-6 w-6 text-white" />
          </div>
        </div>
        <Label htmlFor="specializations" className="text-lg">What do you specialize in?</Label>
        
        <SpecializationTagsInput 
          value={data.specializations} 
          onChange={(specializations) => updateData({ specializations })}
          placeholder="Add another specialization..."
        />
      </div>

      <div className="flex gap-3 mt-6">
        <Button onClick={onBack} variant="outline" className="flex-1 h-12">
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-12 bg-[#141E33] hover:bg-[#1f2c49] text-white"
          disabled={data.specializations.length === 0}
        >
          Review
        </Button>
      </div>
    </div>
  );
}