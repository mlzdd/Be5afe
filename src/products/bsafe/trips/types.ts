export type TripStatus = 'upcoming' | 'active' | 'past';
export type EventStatus = 'confirmed' | 'planning';

export interface Activity {
  id: string;
  time: string;
  title: string;
  location?: string;
  locationCoordinates?: { lat: number; lng: number };
  origin?: string;
  destination?: string;
  distanceKm?: number;
  durationMinutes?: number;
  originLocation?: { lat: number; lng: number };
  destinationLocation?: { lat: number; lng: number };
  routePolyline?: { latitude: number; longitude: number }[];
  category:
    | 'flight' | 'train' | 'bus' | 'ship' | 'drive' | 'car-rental'
    | 'hotel'
    | 'restaurant' | 'tour' | 'shopping' | 'sightseeing'
    | 'other';
  notes?: string;
  status?: EventStatus;
  price?: number;
}

export interface Booking {
  id: string;
  type: 'flight' | 'hotel' | 'car' | 'tour' | 'other';
  title: string;
  confirmationNumber?: string;
  date?: string;
  notes?: string;
  status?: EventStatus;
  price?: number;
}

export interface DayItinerary {
  date: string;
  dayNumber: number;
  activities: Activity[];
}

export interface Trip {
  id: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  notes?: string;
  itinerary: DayItinerary[];
  bookings: Booking[];
  createdAt: string;
  updatedAt: string;
}
