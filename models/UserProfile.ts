export interface UserProfile {
  uid?: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
  role: string;
  industry?: string;
  companySize?: string;
  businessId?: string; // Deprecated - kept for backwards compatibility
  businessIds?: string[]; // New field to support multiple businesses
  onboardingCompleted?: boolean;
  profileCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const roleOptions = [
  { value: 'owner', label: 'Business Owner' },
  { value: 'business-owner', label: 'Business Owner' }, // Legacy support
  { value: 'administrator', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff Member' },
  { value: 'personal_trainer', label: 'Personal Trainer' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'customer', label: 'Customer/Member' },
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