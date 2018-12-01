export type FieldValue = string | boolean | any[];

export type FieldValues = {
  [field: string]: FieldValue;
};

export type EncounterFormProps = {
  encounters: Nedb;
  onCancel: () => void;
  onComplete: () => void;
  onError: (error: Error) => void;
};

export type Intervention = {
  name: string;
  description: string;

  fieldName?: string;
  community?: boolean;
  scored?: boolean;
};
