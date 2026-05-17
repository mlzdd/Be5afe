import type { Trip, Activity, Booking } from '@products/bsafe/trips/types';

export type { Trip, Activity, Booking, DayItinerary, TripStatus, EventStatus } from '@products/bsafe/trips/types';

export interface TripsRepository {
  subscribeToTrips(userId: string, onUpdate: (trips: Trip[]) => void): () => void;
  addTrip(userId: string, trip: Omit<Trip, 'id' | 'itinerary' | 'bookings' | 'createdAt' | 'updatedAt'>): Promise<string>;
  updateTrip(userId: string, tripId: string, updates: Partial<Trip>): Promise<void>;
  deleteTrip(userId: string, tripId: string): Promise<void>;
  addActivity(userId: string, tripId: string, dayDate: string, activity: Omit<Activity, 'id'> & { id?: string }): Promise<void>;
  updateActivity(userId: string, tripId: string, dayDate: string, activityId: string, updates: Partial<Activity>): Promise<void>;
  deleteActivity(userId: string, tripId: string, dayDate: string, activityId: string): Promise<void>;
  addBooking(userId: string, tripId: string, booking: Omit<Booking, 'id'>): Promise<void>;
  deleteBooking(userId: string, tripId: string, bookingId: string): Promise<void>;
}
