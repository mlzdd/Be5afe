export type AlertSource = 'fco' | 'dfat' | 'state_dept' | 'bsafe_editorial';
export type AlertSeverity = 'advisory' | 'warning' | 'do_not_travel';

export interface TravelAlert {
  id: string;
  source: AlertSource;
  countryId: string;
  countryName: string;
  severity: AlertSeverity;
  title: string;
  summary: string;
  body: string;
  publishedAt: string;
  sourceUrl: string;
}
