import { reportedInterventions } from './CrisisReport';
import type { TransformedEncounter } from '../../../shared/transform';

function makeEncounter(overrides: Partial<TransformedEncounter> = {}): TransformedEncounter {
  return { encounterType: 'patient', ...overrides } as TransformedEncounter;
}

describe('reportedInterventions', () => {
  it('reports APS, CPS, and Behavioral/Safety Plan', () => {
    const encounter = makeEncounter({
      adultProtection: true,
      behavioralSafetyPlan: true,
      childProtection: true,
    });

    expect(reportedInterventions(encounter)).toEqual(['APS', 'Behavioral/Safety Plan', 'CPS']);
  });

  it('reports the original crisis interventions', () => {
    const encounter = makeEncounter({
      mandmMortalityAndMorbidity: true,
      psychotherapy: true,
      sciRxAssistance: true,
      suicidehomicide: true,
    });

    expect(reportedInterventions(encounter)).toEqual([
      'M&M',
      'Psychotherapy',
      'SCI RX Assistance',
      'Suicide/homicide',
    ]);
  });

  it('reports nothing for a patient encounter with no reported interventions', () => {
    expect(reportedInterventions(makeEncounter({ careCoordination: true }))).toEqual([]);
  });

  it('reports nothing for non-patient encounters', () => {
    const encounter = makeEncounter({ encounterType: 'community', adultProtection: true });

    expect(reportedInterventions(encounter)).toEqual([]);
  });
});
