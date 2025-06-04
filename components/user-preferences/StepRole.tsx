import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roleOptions } from "@/models/UserProfile";
import { StepProps } from "./types";

export function StepRole({ data, updateData, onNext }: StepProps) {
  const handleRoleChange = (value: string) => {
    updateData({ 
      role: value,
      otherRole: value !== "other" ? "" : data.otherRole 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-[#141E33] p-3">
          <FileText className="h-6 w-6 text-white" />
        </div>
      </div>
      <Label htmlFor="role" className="text-lg">Which role fits you best?</Label>
      <Select value={data.role} onValueChange={handleRoleChange}>
        <SelectTrigger className="mt-2 h-12">
          <SelectValue placeholder="Select your role" />
        </SelectTrigger>
        <SelectContent>
          {roleOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {data.role === "other" && (
        <div className="mt-4">
          <Label htmlFor="otherRole">Please specify your role</Label>
          <Input
            id="otherRole"
            value={data.otherRole}
            onChange={(e) => updateData({ otherRole: e.target.value })}
            placeholder="Enter your role"
            className="mt-2"
          />
        </div>
      )}

      <Button
        onClick={onNext}
        className="w-full h-12 mt-6 bg-[#141E33] hover:bg-[#1f2c49] text-white"
        disabled={!data.role || (data.role === "other" && !data.otherRole)}
      >
        Continue
      </Button>
    </div>
  );
}