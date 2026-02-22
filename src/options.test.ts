import {
  CLINIC_LOCATIONS,
  CLINIC_LOCATION_STAFF_OPTIONS,
  CLINICS,
  COMMUNITY_LOCATION_OPTIONS,
  LOCATIONS,
  TREATMENT_CENTER,
} from './options';

describe('CLINIC_LOCATIONS data integrity', () => {
  it('every location key exists in LOCATIONS', () => {
    for (const location of Object.keys(CLINIC_LOCATIONS)) {
      expect(LOCATIONS).toContain(location);
    }
  });

  it('every clinic in CLINIC_LOCATIONS values exists in CLINICS', () => {
    for (const clinics of Object.values(CLINIC_LOCATIONS)) {
      for (const clinic of clinics) {
        expect(CLINICS).toContain(clinic);
      }
    }
  });
});

describe('COMMUNITY_LOCATION_OPTIONS', () => {
  it('excludes True Cancer Center', () => {
    const values = COMMUNITY_LOCATION_OPTIONS.map((o) => o.value);
    expect(values).not.toContain('True Cancer Center');
  });

  it('includes other locations', () => {
    const values = COMMUNITY_LOCATION_OPTIONS.map((o) => o.value);
    expect(values).toContain('Ballard');
    expect(values).toContain('Cherry Hill');
    expect(values).toContain('Edmonds');
    expect(values).toContain('Issaquah');
    expect(values).toContain('First Hill');
  });
});

describe('CLINIC_LOCATION_STAFF_OPTIONS', () => {
  it('adds Treatment Center to Ballard', () => {
    const values = CLINIC_LOCATION_STAFF_OPTIONS['Ballard'].map((o) => o.value);
    expect(values).toContain(TREATMENT_CENTER);
  });

  it('adds Treatment Center to First Hill', () => {
    const values = CLINIC_LOCATION_STAFF_OPTIONS['First Hill'].map((o) => o.value);
    expect(values).toContain(TREATMENT_CENTER);
  });

  it('adds Treatment Center to Edmonds', () => {
    const values = CLINIC_LOCATION_STAFF_OPTIONS['Edmonds'].map((o) => o.value);
    expect(values).toContain(TREATMENT_CENTER);
  });

  it('adds Treatment Center to Issaquah', () => {
    const values = CLINIC_LOCATION_STAFF_OPTIONS['Issaquah'].map((o) => o.value);
    expect(values).toContain(TREATMENT_CENTER);
  });

  it('does not add Treatment Center to Cherry Hill', () => {
    const values = CLINIC_LOCATION_STAFF_OPTIONS['Cherry Hill'].map((o) => o.value);
    expect(values).not.toContain(TREATMENT_CENTER);
  });

  it('does not add Treatment Center to True Cancer Center', () => {
    const values = CLINIC_LOCATION_STAFF_OPTIONS['True Cancer Center'].map((o) => o.value);
    expect(values).not.toContain(TREATMENT_CENTER);
  });
});
