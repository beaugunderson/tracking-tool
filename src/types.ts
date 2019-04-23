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
};
