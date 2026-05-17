import type { Trip, TripStatus, Activity, Booking, DayItinerary } from './types';

export function getTripStatus(trip: Trip): TripStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(trip.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(trip.endDate);
  end.setHours(23, 59, 59, 999);
  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'active';
}

export function getDaysUntil(date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateDuration(startDate: string, endDate: string): number {
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const sm = start.toLocaleDateString('en-US', { month: 'short' });
  const em = end.toLocaleDateString('en-US', { month: 'short' });
  const year = start.getFullYear();
  if (sm === em) return `${sm} ${start.getDate()}-${end.getDate()}, ${year}`;
  return `${sm} ${start.getDate()} - ${em} ${end.getDate()}, ${year}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function generateDayItinerary(startDate: string, endDate: string): DayItinerary[] {
  const days: DayItinerary[] = [];
  let dayNumber = 1;
  for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
    days.push({ date: d.toISOString().split('T')[0], dayNumber: dayNumber++, activities: [] });
  }
  return days;
}

export function getCategoryIcon(category: Activity['category']): string {
  const map: Record<Activity['category'], string> = {
    flight: 'airplane', train: 'train', bus: 'bus', ship: 'boat',
    drive: 'car-sport', 'car-rental': 'car', hotel: 'bed',
    restaurant: 'restaurant', tour: 'map', shopping: 'bag',
    sightseeing: 'camera', other: 'ellipsis-horizontal-circle',
  };
  return map[category];
}

export function getBookingIcon(type: Booking['type']): string {
  const map: Record<Booking['type'], string> = {
    flight: 'airplane', hotel: 'bed', car: 'car', tour: 'map', other: 'document',
  };
  return map[type];
}

export function calculateTotalPrice(activities: Activity[]): number {
  return activities.reduce((sum, a) => sum + (a.price ?? 0), 0);
}

export function calculateDistanceKm(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((origin.lat * Math.PI) / 180) *
    Math.cos((destination.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateDriveDurationMinutes(distanceKm: number): number {
  return Math.max(1, Math.round(distanceKm * 5));
}

export function downsamplePolyline(
  polyline: { latitude: number; longitude: number }[],
  step = 4,
): { latitude: number; longitude: number }[] {
  if (polyline.length <= 2 || step <= 1) return polyline;
  return polyline.filter((_, i) => i % step === 0 || i === polyline.length - 1);
}
