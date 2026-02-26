import { INTERVENTION_FIELDS } from './intervention-fields';
import { INTERVENTIONS } from '../renderer/src/patient-interventions';

describe('INTERVENTION_FIELDS', () => {
  it('has the same fieldName/name pairs as the renderer INTERVENTIONS', () => {
    const sharedSet = INTERVENTION_FIELDS.map(
      ({ fieldName, name }) => `${fieldName}:${name}`,
    ).sort();
    const rendererSet = INTERVENTIONS.map(({ fieldName, name }) => `${fieldName}:${name}`).sort();
    expect(sharedSet).toEqual(rendererSet);
  });

  it('has the correct count', () => {
    expect(INTERVENTION_FIELDS.length).toBe(INTERVENTIONS.length);
  });
});
