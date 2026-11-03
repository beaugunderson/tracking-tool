import { projectEncounter, REPORTED_INTERVENTIONS, reportedInterventions } from './report-fields';
import { type RawEncounter, type TransformedEncounter, transformEncounter } from './transform';

// What the Intervention Report sees: a saved encounter after the main process transforms it and
// strips it down to the report fields.
function throughReportPipeline(raw: Partial<RawEncounter>): TransformedEncounter {
  const transformed = transformEncounter({
    _id: 'abc123',
    encounterDate: '2026-11-02',
    encounterType: 'patient',
    numberOfTasks: '1',
    timeSpent: '15',
    username: 'testuser',
    ...raw,
  } as RawEncounter);

  return projectEncounter(
    transformed as unknown as Record<string, unknown>,
  ) as TransformedEncounter;
}

describe('reportedInterventions', () => {
  it.each(REPORTED_INTERVENTIONS)(
    'reports %s after the main process strips fields',
    (field, label) => {
      const encounter = throughReportPipeline({ [field]: true });

      expect(reportedInterventions(encounter)).toEqual([label]);
    },
  );

  it('reports every checked intervention in order', () => {
    const encounter = throughReportPipeline({
      adultProtection: true,
      behavioralSafetyPlan: true,
      childProtection: true,
      suicidehomicide: true,
    });

    expect(reportedInterventions(encounter)).toEqual([
      'APS',
      'Behavioral/Safety Plan',
      'CPS',
      'Suicide/homicide',
    ]);
  });

  it('reports nothing for a patient encounter with no reported interventions', () => {
    expect(reportedInterventions(throughReportPipeline({ careCoordination: true }))).toEqual([]);
  });

  it('reports nothing for non-patient encounters', () => {
    const encounter = throughReportPipeline({ encounterType: 'community', adultProtection: true });

    expect(reportedInterventions(encounter)).toEqual([]);
  });

  it('keeps the patient name for the report', () => {
    expect(throughReportPipeline({ patientName: 'Jane Doe' }).patientName).toBe('Jane Doe');
  });
});
