import type React from 'react';
import type { CommunityEncounter } from './forms/CommunityEncounterForm';
import type { OtherEncounter } from './forms/OtherEncounterForm';
import type { PatientEncounter } from './forms/PatientEncounterForm';
import type { StaffEncounter } from './forms/StaffEncounterForm';

export type Encounter = PatientEncounter | CommunityEncounter | StaffEncounter | OtherEncounter;

export type EncounterFormProps = {
  onCancel: () => void;
  onComplete: (error?: Error) => void;
};

export type Intervention = {
  name: string;
  description: React.ReactNode;

  fieldName: string;
  community?: boolean;
  scored?: boolean;

  editableBy?: string[];
};
