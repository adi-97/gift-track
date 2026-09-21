export interface FieldList {
  id: string;
  name: string;
  createdAt: number;
}

export type EntryType = "gift" | "cash";

export interface FieldItem {
  id: string;
  listId: string;
  number: number;
  photoBlob: Blob;
  caption: string;
  ocrText: string;
  entryType: EntryType;
  createdAt: number;
}

export interface AppSettings {
  key: string;
  ocrEnabled: boolean;
  theme: "system" | "light" | "dark";
}
