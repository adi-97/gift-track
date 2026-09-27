import Dexie, { type Table } from "dexie";
import type { AppSettings, EntryType, FieldItem, FieldList } from "./types";

class GiftTrackDB extends Dexie {
  lists!: Table<FieldList, string>;
  items!: Table<FieldItem, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("gift-track-db");
    this.version(1).stores({
      lists: "id, createdAt",
      items: "id, listId, [listId+number], createdAt",
      settings: "key",
    });
  }
}

export const db = new GiftTrackDB();

export async function createList(name: string): Promise<FieldList> {
  const list: FieldList = {
    id: crypto.randomUUID(),
    name: name.trim() || "Untitled list",
    createdAt: Date.now(),
  };
  await db.lists.add(list);
  return list;
}

export async function deleteList(listId: string): Promise<void> {
  await db.transaction("rw", db.lists, db.items, async () => {
    await db.items.where("listId").equals(listId).delete();
    await db.lists.delete(listId);
  });
}

export async function getListItemCount(listId: string): Promise<number> {
  return db.items.where("listId").equals(listId).count();
}

export async function addItem(params: {
  listId: string;
  photoBlob: Blob | null;
  caption: string;
  ocrText: string;
  entryType: EntryType;
  amount: number | null;
}): Promise<FieldItem> {
  return db.transaction("rw", db.items, async () => {
    const count = await db.items.where("listId").equals(params.listId).count();
    const item: FieldItem = {
      id: crypto.randomUUID(),
      listId: params.listId,
      number: count + 1,
      photoBlob: params.photoBlob,
      caption: params.caption.trim() || (params.photoBlob ? "Untitled photo" : "Untitled entry"),
      ocrText: params.ocrText,
      entryType: params.entryType,
      amount: params.entryType === "cash" ? params.amount : null,
      createdAt: Date.now(),
    };
    await db.items.add(item);
    return item;
  });
}

export async function deleteItem(itemId: string): Promise<void> {
  const item = await db.items.get(itemId);
  if (!item) return;
  await db.transaction("rw", db.items, async () => {
    await db.items.delete(itemId);
    // renumber remaining items in the list to stay contiguous
    const remaining = await db.items
      .where("listId")
      .equals(item.listId)
      .sortBy("number");
    await Promise.all(
      remaining.map((it, idx) =>
        it.number !== idx + 1
          ? db.items.update(it.id, { number: idx + 1 })
          : Promise.resolve()
      )
    );
  });
}

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get("app");
  if (existing) return existing;
  const defaults: AppSettings = { key: "app", ocrEnabled: true, theme: "system" };
  await db.settings.put(defaults);
  return defaults;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await db.settings.put(next);
  return next;
}
