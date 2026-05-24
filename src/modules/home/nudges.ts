import type { Trip } from '@products/bsafe/trips/types';
import type { TravelAlert } from '@products/bsafe/alerts/types';
import { countryScams } from '@products/bsafe/safety-data';

export interface Nudge {
  id: string;
  icon: string;
  text: string;
  action?: { label: string; screen: string };
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export function getHomeNudges(
  trips: Trip[],
  alerts: TravelAlert[],
  packingTotal: number,
  packingPacked: number,
  countryId: string | null,
  dismissedIds: Set<string>
): Nudge[] {
  const nudges: Nudge[] = [];

  // Next upcoming trip
  const upcoming = trips
    .filter((t) => t.startDate && daysUntil(t.startDate) > 0)
    .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

  const next = upcoming[0];
  if (next) {
    const days = daysUntil(next.startDate!);
    const countryName = next.destination;
    const scamCount = countryName ? (countryScams[countryName]?.length ?? 0) : 0;

    if (days <= 14 && scamCount > 0) {
      const id = `trip-scams-${next.id}`;
      if (!dismissedIds.has(id)) {
        nudges.push({
          id,
          icon: 'warning',
          text: `${days === 1 ? 'Tomorrow' : `In ${days} days`} in ${countryName} — ${scamCount} common scam${scamCount > 1 ? 's' : ''} to know`,
          action: { label: 'View scams', screen: 'ScamAlerts' },
        });
      }
    }

    if (days <= 3) {
      const id = `trip-imminent-${next.id}`;
      if (!dismissedIds.has(id)) {
        nudges.push({
          id,
          icon: 'airplane',
          text: `You ${days === 1 ? 'land tomorrow' : days === 0 ? 'land today' : `leave in ${days} days`} — make sure your emergency contacts are up to date`,
          action: { label: 'Emergency', screen: 'Emergency' },
        });
      }
    }
  }

  // Packing progress
  if (packingTotal > 0 && packingPacked < packingTotal) {
    const pct = Math.round((packingPacked / packingTotal) * 100);
    const remaining = packingTotal - packingPacked;
    const id = `packing-progress`;
    if (!dismissedIds.has(id)) {
      nudges.push({
        id,
        icon: 'cube',
        text: `Packing list is ${pct}% done — ${remaining} item${remaining > 1 ? 's' : ''} remaining`,
        action: { label: 'View list', screen: 'PackingList' },
      });
    }
  }

  // Recent alerts for selected country
  if (countryId) {
    const recentMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    const recentAlerts = alerts.filter(
      (a) =>
        a.countryId?.toLowerCase() === countryId.toLowerCase() &&
        a.publishedAt &&
        Date.now() - new Date(a.publishedAt).getTime() < recentMs
    );
    if (recentAlerts.length > 0) {
      const id = `alerts-${countryId}`;
      if (!dismissedIds.has(id)) {
        nudges.push({
          id,
          icon: 'alert-circle',
          text: `${recentAlerts.length} new alert${recentAlerts.length > 1 ? 's' : ''} for ${countryId.toUpperCase()} in the last 7 days`,
          action: { label: 'View alerts', screen: 'LiveAlerts' },
        });
      }
    }
  }

  return nudges.slice(0, 4); // cap at 4
}
