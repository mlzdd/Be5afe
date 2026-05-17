// Documents
export type DocumentType =
  | 'passport' | 'visa' | 'insurance' | 'flight' | 'hotel' | 'vaccination' | 'license' | 'other';

export interface TravelDocument {
  id: string;
  type: DocumentType;
  title: string;
  documentNumber: string;
  issuingCountry?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Packing
export type PackingCategory = 'clothing' | 'toiletries' | 'electronics' | 'documents' | 'medication' | 'other';

export interface PackingItem {
  id: string;
  name: string;
  category: PackingCategory;
  packed: boolean;
  quantity?: number;
  tripId?: string;
  createdAt: string;
}

export interface MedicalCard {
  bloodType: string;
  allergies: string;
  conditions: string;
  medications: string;
  organDonor: boolean;
  emergencyNotes: string;
  doctorName: string;
  doctorPhone: string;
}
