import type React from 'react';

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
