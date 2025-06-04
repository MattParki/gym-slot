export interface UserPreferencesData {
  role: string;
  otherRole: string;
  industry: string;
  otherIndustry: string;
  companySize: string;
  specializations: string[];
}

export interface StepProps {
  data: UserPreferencesData;
  updateData: (updates: Partial<UserPreferencesData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export interface SummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: UserPreferencesData;
  onSubmit: () => void;
  onEdit: () => void;
  loading: boolean;
}

export interface ExitConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onExit: () => void;
}