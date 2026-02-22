import { DOCTORS, isInactive, RAW_DOCTORS } from './doctors';

describe('isInactive', () => {
  it('returns false for active doctor', () => {
    expect(isInactive('Abrams, Deborah')).toBe(false);
  });

  it('returns true for inactive doctor', () => {
    expect(isInactive('Agena, Joanna')).toBe(true);
  });

  it('returns false for unknown value', () => {
    expect(isInactive('Nonexistent, Doctor')).toBe(false);
  });
});

describe('DOCTORS mapping', () => {
  it('doctors without explicit value get text as value', () => {
    const abrams = DOCTORS.find((d) => d.text === 'Abrams, Deborah');
    expect(abrams.value).toBe('Abrams, Deborah');
  });

  it('doctors with explicit value keep it', () => {
    const buscariollo = DOCTORS.find((d) => d.text === 'Buscariollo, Daniela');
    expect(buscariollo.value).toBe('Buscariolo, Daniela');
  });

  it('Crown Angelena maps to Crown Angelina', () => {
    const crown = DOCTORS.find((d) => d.text === 'Crown, Angelena');
    expect(crown.value).toBe('Crown, Angelina');
  });

  it('Solanki has misspelled value', () => {
    const solanki = DOCTORS.find((d) => d.text === 'Solanki, Krupa');
    expect(solanki.value).toBe('Solanki, Kupra');
  });

  it('has same length as RAW_DOCTORS', () => {
    expect(DOCTORS.length).toBe(RAW_DOCTORS.length);
  });

  it('every doctor has a value', () => {
    for (const doctor of DOCTORS) {
      expect(doctor.value).toBeTruthy();
    }
  });
});
