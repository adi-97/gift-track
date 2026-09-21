import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, deleteList } from "../db";
import CaptureFlow from "../components/CaptureFlow";
import ConfirmDialog from "../components/ConfirmDialog";
import SettingsSheet from "../components/SettingsSheet";
import { IconPlus, IconSettings, IconTrash } from "../components/icons";
import { useToast } from "../hooks/useToast";
import type { FieldList } from "../types";
import "./HomeScreen.css";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [capturing, setCapturing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FieldList | null>(null);

  const lists = useLiveQuery(async () => {
    const allLists = await db.lists.orderBy("createdAt").reverse().toArray();
    const withCounts = await Promise.all(
      allLists.map(async (list) => ({
        list,
        count: await db.items.where("listId").equals(list.id).count(),
      }))
    );
    return withCounts;
  }, []);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    const name = pendingDelete.name;
    await deleteList(pendingDelete.id);
    setPendingDelete(null);
    showToast(`Deleted "${name}"`);
  }

  return (
    <div className="home">
      <header className="home__header">
        <div>
          <h1 className="home__title">Gift Track</h1>
          <p className="home__subtitle">Numbered gift &amp; cash log, captured on the go</p>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
        >
          <IconSettings />
        </button>
      </header>

      <main className="home__content">
        {lists && lists.length === 0 && (
          <div className="home__empty">
            <p>No lists yet.</p>
            <p className="home__empty-sub">Tap the + button to snap your first photo.</p>
          </div>
        )}

        <div className="home__grid">
          {lists?.map(({ list, count }, index) => (
            <button
              key={list.id}
              type="button"
              className="list-card card-pop-in"
              style={{ "--i": index } as CSSProperties}
              onClick={() => navigate(`/list/${list.id}`)}
            >
              <span className="list-card__tab" aria-hidden="true" />
              <span className="list-card__name">{list.name}</span>
              <span className="list-card__meta">
                <span className="stamp">{count} item{count === 1 ? "" : "s"}</span>
                <span className="stamp">{formatDate(list.createdAt)}</span>
              </span>
              <span
                className="list-card__delete"
                role="button"
                aria-label={`Delete list ${list.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDelete(list);
                }}
              >
                <IconTrash />
              </span>
            </button>
          ))}
        </div>
      </main>

      <button
        type="button"
        className="fab fab--primary"
        onClick={() => setCapturing(true)}
        aria-label="New list"
      >
        <IconPlus />
      </button>

      {capturing && (
        <CaptureFlow
          mode="new-list"
          onDone={(listId) => {
            setCapturing(false);
            navigate(`/list/${listId}`);
          }}
          onCancel={() => setCapturing(false)}
        />
      )}

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this list?"
          body={`"${pendingDelete.name}" and all of its photos will be permanently deleted.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
