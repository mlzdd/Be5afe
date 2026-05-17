import {
  buildFcoAlertDocument,
  buildStateDeptAlertDocument,
  deriveStateDeptSeverity,
  deriveSeverity,
  differsFromStoredAlert,
  resolveCountryId,
  stripHtml,
} from './alert-utils';

describe('alert-utils', () => {
  it('derives severity from FCDO alert statuses', () => {
    expect(deriveSeverity(['avoid_all_travel_to_parts'])).toBe('do_not_travel');
    expect(deriveSeverity(['avoid_all_but_essential_travel_to_whole_country'])).toBe('warning');
    expect(deriveSeverity([])).toBe('advisory');
  });

  it('resolves local country ids from official names and synonyms', () => {
    expect(resolveCountryId('United Arab Emirates', ['UAE'])).toBe('AE');
    expect(resolveCountryId('USA', ['United States'])).toBe('US');
    expect(resolveCountryId('Imaginary Country')).toBeNull();
  });

  it('strips simple HTML before storing body text', () => {
    expect(stripHtml('<p>Exercise <strong>caution</strong> &amp; stay alert.</p>')).toBe(
      'Exercise caution & stay alert.',
    );
  });

  it('builds deterministic FCO documents', () => {
    const alert = buildFcoAlertDocument({
      contentId: 'abc-123',
      basePath: '/foreign-travel-advice/jordan',
      title: 'Jordan travel advice',
      countryId: 'JO',
      countryName: 'Jordan',
      alertStatuses: ['avoid_all_travel_to_parts'],
      summary: 'Regional escalation.',
      bodyHtml: '<p>Read the latest warnings.</p>',
      publishedAt: '2026-04-14T15:32:53Z',
      nowIso: '2026-05-17T00:00:00.000Z',
    });

    expect(alert.id).toBe('fco-abc-123');
    expect(alert.severity).toBe('do_not_travel');
    expect(alert.body).toBe('Read the latest warnings.');
    expect(alert.sourceName).toBe('UK FCDO');
  });

  it('maps State Department levels into Be5afe severities', () => {
    expect(deriveStateDeptSeverity('Sudan - Level 4: Do Not Travel')).toBe('do_not_travel');
    expect(deriveStateDeptSeverity('Jordan - Level 3: Reconsider Travel')).toBe('warning');
    expect(deriveStateDeptSeverity('Canada - Level 1: Exercise Normal Precautions')).toBe('advisory');
  });

  it('builds deterministic State Department documents', () => {
    const alert = buildStateDeptAlertDocument({
      guid: 'https://travel.state.gov/example',
      link: 'https://travel.state.gov/example',
      title: 'Sudan - Level 4: Do Not Travel',
      countryId: 'SD',
      countryName: 'Sudan',
      descriptionHtml: '<p>Do not travel.</p>',
      publishedAt: '2026-05-15T00:00:00.000Z',
      nowIso: '2026-05-17T00:00:00.000Z',
    });

    expect(alert.id).toBe('state_dept-SD');
    expect(alert.severity).toBe('do_not_travel');
    expect(alert.sourceName).toBe('US State Department');
  });

  it('ignores volatile fetch timestamps when comparing stored alerts', () => {
    const alert = buildFcoAlertDocument({
      contentId: 'abc-123',
      basePath: '/foreign-travel-advice/jordan',
      title: 'Jordan travel advice',
      countryId: 'JO',
      countryName: 'Jordan',
      alertStatuses: ['avoid_all_travel_to_parts'],
      summary: 'Regional escalation.',
      bodyHtml: '<p>Read the latest warnings.</p>',
      publishedAt: '2026-04-14T15:32:53Z',
      nowIso: '2026-05-17T00:00:00.000Z',
    });

    expect(
      differsFromStoredAlert(
        {
          ...alert,
          lastFetchedAt: '2026-05-16T00:00:00.000Z',
          nextReviewAt: '2026-05-16T00:00:00.000Z',
          createdAt: '2026-05-16T00:00:00.000Z',
          updatedAt: '2026-05-16T00:00:00.000Z',
        },
        alert,
      ),
    ).toBe(false);
    expect(differsFromStoredAlert({ ...alert, severity: 'warning' }, alert)).toBe(true);
  });
});
