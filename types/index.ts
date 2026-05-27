export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  dni?: string;
  address?: string;
  avatar?: string;
  petsCount: number;
  joinedDate: string;
}

export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string;
  age: string;
  ownerName: string;
  ownerId: string;
  sex?: string;
  weight?: string;
  avatar?: string;
  lastVisit?: string;
}

export type AppointmentStatus = 'Scheduled' | 'Checked-in' | 'In-Progress' | 'Completed' | 'Cancelled';
export type AppointmentType = 'Consultation' | 'Surgery' | 'Vaccination' | 'Check-up' | 'Dental' | 'Grooming';

export interface Appointment {
  id: string;
  petName: string;
  petSpecies: Pet['species'];
  ownerName: string;
  ownerPhone?: string;
  ownerDni?: string;
  date: string;
  time: string;
  type: AppointmentType;
  status: AppointmentStatus;
  veterinarian: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: 'Medication' | 'Food' | 'Equipment' | 'Supplies';
  stock: number;
  minStock: number;
  unit: string;
  price: number;
}

export interface VaccineReminder {
  id: string;
  petName: string;
  petSpecies: Pet['species'];
  vaccineName: string;
  dueDate: string;
  ownerName: string;
  ownerEmail: string;
  status: 'Pending' | 'Sent' | 'Overdue';
}

export interface RevenueData {
  date: string;
  amount: number;
  appointments: number;
}
