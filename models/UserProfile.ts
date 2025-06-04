export interface UserProfile {
  uid?: string;
  email?: string;
  displayName?: string;
  role: string;
  industry: string;
  companySize: string;
  specializations: string[];
  businessId?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export const roleOptions = [
  { value: 'sales-rep', label: 'Sales Rep' },
  { value: 'account-executive', label: 'Account Executive' },
  { value: 'head-of-sales', label: 'Head of Sales' },
  { value: 'business-owner', label: 'Business Owner' },
  { value: 'marketing-manager', label: 'Marketing Manager' },
  { value: 'freelancer', label: 'Freelancer/Consultant' },
  { value: 'other', label: 'Other' },
];

export const companySizeOptions = [
  { value: 'just-me', label: 'Just me' },
  { value: '2-10', label: '2-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];