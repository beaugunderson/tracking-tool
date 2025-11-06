import type Nedb from 'nedb';
import type React from 'react';

export type EncounterFormProps = {
  encounters: Nedb;
  onCancel: () => void;
  onComplete: (error?: Error) => void;
};

export type Intervention = {
  name: string;
  description: React.ReactNode;

  fieldName: string;
  community?: boolean;
  scored?: boolean;

  visibleTo?: string[];
};
