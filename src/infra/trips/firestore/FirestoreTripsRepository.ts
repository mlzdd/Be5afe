import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@infra/database/firestore';
import type { TripsRepository, Trip, Activity, Booking, DayItinerary } from '@shared/contracts/TripsRepository';

function generateDayItinerary(startDate: string, endDate: string): DayItinerary[] {
  const days: DayItinerary[] = [];
  let dayNumber = 1;
  for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
    days.push({ date: d.toISOString().split('T')[0], dayNumber: dayNumber++, activities: [] });
  }
  return days;
}

function strip<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function requireDb() {
  if (!db) throw new Error('Firebase not configured — add credentials to .env');
  return db;
}

export class FirestoreTripsRepository implements TripsRepository {
  subscribeToTrips(userId: string, onUpdate: (trips: Trip[]) => void): () => void {
    if (!db) { onUpdate([]); return () => {}; }
    const q = query(
      collection(db, 'users', userId, 'trips'),
      orderBy('startDate', 'asc'),
    );
    return onSnapshot(q, (snap) => {
      onUpdate(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip)));
    });
  }

  async addTrip(
    userId: string,
    data: Omit<Trip, 'id' | 'itinerary' | 'bookings' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const db = requireDb();
    const id = newId();
    const now = new Date().toISOString();
    const trip: Trip = {
      id, ...data,
      itinerary: generateDayItinerary(data.startDate, data.endDate),
      bookings: [], createdAt: now, updatedAt: now,
    };
    await setDoc(doc(db, 'users', userId, 'trips', id), strip({ ...trip, updatedAt: serverTimestamp() }));
    return id;
  }

  async updateTrip(userId: string, tripId: string, updates: Partial<Trip>): Promise<void> {
    const db = requireDb();
    await updateDoc(
      doc(db, 'users', userId, 'trips', tripId),
      strip({ ...updates, updatedAt: serverTimestamp() }),
    );
  }

  async deleteTrip(userId: string, tripId: string): Promise<void> {
    const db = requireDb();
    await deleteDoc(doc(db, 'users', userId, 'trips', tripId));
  }

  async addActivity(
    userId: string, tripId: string, dayDate: string,
    activity: Omit<Activity, 'id'> & { id?: string },
  ): Promise<void> {
    const db = requireDb();
    const trip = await this._getTrip(userId, tripId);
    if (!trip) return;
    const newActivity: Activity = { ...activity, id: activity.id ?? newId() } as Activity;
    const itinerary = trip.itinerary.map((day) =>
      day.date === dayDate
        ? { ...day, activities: [...day.activities, newActivity] }
        : day,
    );
    await updateDoc(doc(db, 'users', userId, 'trips', tripId), strip({ itinerary, updatedAt: serverTimestamp() }));
  }

  async updateActivity(
    userId: string, tripId: string, dayDate: string,
    activityId: string, updates: Partial<Activity>,
  ): Promise<void> {
    const db = requireDb();
    const trip = await this._getTrip(userId, tripId);
    if (!trip) return;
    const itinerary = trip.itinerary.map((day) =>
      day.date === dayDate
        ? { ...day, activities: day.activities.map((a) => a.id === activityId ? { ...a, ...updates } : a) }
        : day,
    );
    await updateDoc(doc(db, 'users', userId, 'trips', tripId), strip({ itinerary, updatedAt: serverTimestamp() }));
  }

  async deleteActivity(userId: string, tripId: string, dayDate: string, activityId: string): Promise<void> {
    const db = requireDb();
    const trip = await this._getTrip(userId, tripId);
    if (!trip) return;
    const itinerary = trip.itinerary.map((day) =>
      day.date === dayDate
        ? { ...day, activities: day.activities.filter((a) => a.id !== activityId) }
        : day,
    );
    await updateDoc(doc(db, 'users', userId, 'trips', tripId), strip({ itinerary, updatedAt: serverTimestamp() }));
  }

  async addBooking(userId: string, tripId: string, booking: Omit<Booking, 'id'>): Promise<void> {
    const db = requireDb();
    const trip = await this._getTrip(userId, tripId);
    if (!trip) return;
    const newBooking: Booking = { ...booking, id: newId() };
    await updateDoc(
      doc(db, 'users', userId, 'trips', tripId),
      strip({ bookings: [...trip.bookings, newBooking], updatedAt: serverTimestamp() }),
    );
  }

  async deleteBooking(userId: string, tripId: string, bookingId: string): Promise<void> {
    const db = requireDb();
    const trip = await this._getTrip(userId, tripId);
    if (!trip) return;
    await updateDoc(
      doc(db, 'users', userId, 'trips', tripId),
      strip({ bookings: trip.bookings.filter((b) => b.id !== bookingId), updatedAt: serverTimestamp() }),
    );
  }

  private async _getTrip(userId: string, tripId: string): Promise<Trip | null> {
    const db = requireDb();
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'users', userId, 'trips', tripId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Trip) : null;
  }
}
