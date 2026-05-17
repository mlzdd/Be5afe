import { useState, useEffect, useCallback } from 'react';
import type { TripsRepository, Trip, Activity, Booking } from '@shared/contracts/TripsRepository';
import { generateDayItinerary } from './tripUtils';

interface CurrentUser { uid: string }

interface TripsState {
  trips: Trip[];
  isLoading: boolean;
  addTrip(trip: Omit<Trip, 'id' | 'itinerary' | 'bookings' | 'createdAt' | 'updatedAt'>): Promise<void>;
  updateTrip(id: string, updates: Partial<Trip>): Promise<void>;
  deleteTrip(id: string): Promise<void>;
  addActivity(tripId: string, dayDate: string, activity: Omit<Activity, 'id'> & { id?: string }): Promise<void>;
  updateActivity(tripId: string, dayDate: string, activityId: string, updates: Partial<Activity>): Promise<void>;
  deleteActivity(tripId: string, dayDate: string, activityId: string): Promise<void>;
  moveActivity(tripId: string, fromDate: string, toDate: string, activityId: string, updatedData: Omit<Activity, 'id'>): Promise<void>;
  addBooking(tripId: string, booking: Omit<Booking, 'id'>): Promise<void>;
  deleteBooking(tripId: string, bookingId: string): Promise<void>;
  getTripById(id: string): Trip | undefined;
}

export function useTrips(
  repository: TripsRepository,
  currentUser: CurrentUser | null,
): TripsState {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(!!currentUser);

  useEffect(() => {
    if (!currentUser) { setIsLoading(false); return; }
    const unsub = repository.subscribeToTrips(currentUser.uid, setTrips);
    setIsLoading(false);
    return unsub;
  }, [repository, currentUser?.uid]);

  const addTrip = useCallback(async (
    data: Omit<Trip, 'id' | 'itinerary' | 'bookings' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (!currentUser) return;
    await repository.addTrip(currentUser.uid, data);
  }, [repository, currentUser]);

  const updateTrip = useCallback((id: string, updates: Partial<Trip>) => {
    if (!currentUser) return Promise.resolve();
    return repository.updateTrip(currentUser.uid, id, updates);
  }, [repository, currentUser]);

  const deleteTrip = useCallback((id: string) => {
    if (!currentUser) return Promise.resolve();
    return repository.deleteTrip(currentUser.uid, id);
  }, [repository, currentUser]);

  const addActivity = useCallback((
    tripId: string, dayDate: string, activity: Omit<Activity, 'id'> & { id?: string },
  ) => {
    if (!currentUser) return Promise.resolve();
    return repository.addActivity(currentUser.uid, tripId, dayDate, activity);
  }, [repository, currentUser]);

  const updateActivity = useCallback((
    tripId: string, dayDate: string, activityId: string, updates: Partial<Activity>,
  ) => {
    if (!currentUser) return Promise.resolve();
    return repository.updateActivity(currentUser.uid, tripId, dayDate, activityId, updates);
  }, [repository, currentUser]);

  const deleteActivity = useCallback((
    tripId: string, dayDate: string, activityId: string,
  ) => {
    if (!currentUser) return Promise.resolve();
    return repository.deleteActivity(currentUser.uid, tripId, dayDate, activityId);
  }, [repository, currentUser]);

  const moveActivity = useCallback(async (
    tripId: string, fromDate: string, toDate: string,
    activityId: string, updatedData: Omit<Activity, 'id'>,
  ) => {
    if (!currentUser) return;
    await repository.deleteActivity(currentUser.uid, tripId, fromDate, activityId);
    await repository.addActivity(currentUser.uid, tripId, toDate, { ...updatedData, id: activityId });
  }, [repository, currentUser]);

  const addBooking = useCallback((tripId: string, booking: Omit<Booking, 'id'>) => {
    if (!currentUser) return Promise.resolve();
    return repository.addBooking(currentUser.uid, tripId, booking);
  }, [repository, currentUser]);

  const deleteBooking = useCallback((tripId: string, bookingId: string) => {
    if (!currentUser) return Promise.resolve();
    return repository.deleteBooking(currentUser.uid, tripId, bookingId);
  }, [repository, currentUser]);

  const getTripById = useCallback((id: string) =>
    trips.find((t) => t.id === id), [trips]);

  return { trips, isLoading, addTrip, updateTrip, deleteTrip, addActivity, updateActivity, deleteActivity, moveActivity, addBooking, deleteBooking, getTripById };
}

export { generateDayItinerary };
