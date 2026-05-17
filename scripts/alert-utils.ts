import { COUNTRIES } from '../src/modules/regional-data/data/countries';
import type { AlertSeverity, FeedAlertDocument } from './alert-types';

export const ALERT_SCHEMA_VERSION = 1;

const countryIdByNormalizedName = new Map<string, string>(
  COUNTRIES.flatMap((country) => [
    [normalizeCountryName(country.name), country.iso2],
    [normalizeCountryName(country.iso2), country.iso2],
  ]),
);

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  'united arab emirates': 'AE',
  uae: 'AE',
  usa: 'US',
  'united states': 'US',
  'czechia': 'CZ',
  'south korea': 'KR',
  'czech republic': 'CZ',
};

export function deriveSeverity(alertStatuses: string[]): AlertSeverity {
  if (alertStatuses.some((status) => status.includes('avoid_all_travel'))) {
    return 'do_not_travel';
  }

  if (alertStatuses.some((status) => status.includes('avoid_all_but_essential_travel'))) {
    return 'warning';
  }

  return 'advisory';
}

export function stripHtml(html: string | undefined): string {
  if (!html) return '';

  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

export function resolveCountryId(countryName: string, synonyms: string[] = []): string | null {
  for (const candidate of [countryName, ...synonyms]) {
    const normalized = normalizeCountryName(candidate);
    const alias = COUNTRY_NAME_ALIASES[normalized];
    if (alias) return alias;

    const direct = countryIdByNormalizedName.get(normalized);
    if (direct) return direct;
  }

  return null;
}

export function buildFcoAlertDocument(input: {
  contentId: string;
  basePath: string;
  title: string;
  countryId: string;
  countryName: string;
  alertStatuses: string[];
  summary: string;
  bodyHtml?: string;
  publishedAt: string;
  nowIso: string;
}): FeedAlertDocument {
  return {
    id: `fco-${input.contentId}`,
    source: 'fco',
    sourceNativeId: input.contentId,
    sourceName: 'UK FCDO',
    sourceUrl: `https://www.gov.uk${input.basePath}`,
    sourceType: 'official',
    countryId: input.countryId,
    countryName: input.countryName,
    severity: deriveSeverity(input.alertStatuses),
    title: input.title,
    summary: input.summary,
    body: stripHtml(input.bodyHtml),
    publishedAt: input.publishedAt,
    lastFetchedAt: input.nowIso,
    confidence: 'high',
    status: 'published',
    nextReviewAt: input.nowIso,
    createdAt: input.nowIso,
    updatedAt: input.nowIso,
    updatedBy: 'system:fco_feed',
    previousStatus: 'draft',
    schemaVersion: ALERT_SCHEMA_VERSION,
  };
}

export function deriveStateDeptSeverity(title: string): AlertSeverity {
  if (/level 4/i.test(title)) return 'do_not_travel';
  if (/level [23]/i.test(title)) return 'warning';
  return 'advisory';
}

export function buildStateDeptAlertDocument(input: {
  guid: string;
  link: string;
  title: string;
  countryId: string;
  countryName: string;
  descriptionHtml: string;
  publishedAt: string;
  nowIso: string;
}): FeedAlertDocument {
  return {
    id: `state_dept-${input.countryId}`,
    source: 'state_dept',
    sourceNativeId: input.guid,
    sourceName: 'US State Department',
    sourceUrl: input.link,
    sourceType: 'official',
    countryId: input.countryId,
    countryName: input.countryName,
    severity: deriveStateDeptSeverity(input.title),
    title: input.title,
    summary: stripHtml(input.descriptionHtml).slice(0, 280),
    body: stripHtml(input.descriptionHtml),
    publishedAt: input.publishedAt,
    lastFetchedAt: input.nowIso,
    confidence: 'high',
    status: 'published',
    nextReviewAt: input.nowIso,
    createdAt: input.nowIso,
    updatedAt: input.nowIso,
    updatedBy: 'system:state_dept_feed',
    previousStatus: 'draft',
    schemaVersion: ALERT_SCHEMA_VERSION,
  };
}

export function differsFromStoredAlert(
  stored: Partial<FeedAlertDocument> | undefined,
  next: FeedAlertDocument,
): boolean {
  if (!stored) return true;

  const stableFields: Array<keyof FeedAlertDocument> = [
    'id',
    'source',
    'sourceNativeId',
    'sourceName',
    'sourceUrl',
    'sourceType',
    'countryId',
    'countryName',
    'severity',
    'title',
    'summary',
    'body',
    'publishedAt',
    'confidence',
    'status',
    'updatedBy',
    'schemaVersion',
  ];

  return stableFields.some((field) => stored[field] !== next[field]);
}

function normalizeCountryName(value: string): string {
  return value.trim().toLowerCase();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
