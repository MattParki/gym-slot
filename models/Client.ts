export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  website?: string;
  status: 'lead' | 'prospect' | 'client' | string;
  lastContactDate: string;
  notes: string;
  userId: string;
  createdAt: string;
}