import { useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db, deleteItem, deleteList } from "../db";
import CaptureFlow from "../components/CaptureFlow";
import ConfirmDialog from "../components/ConfirmDialog";
import PhotoImage from "../components/PhotoImage";
import { IconBack, IconClose, IconPlus, IconTrash } from "../components/icons";
import { useToast } from "../hooks/useToast";
import type { FieldItem } from "../types";
import "./ListScreen.css";

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

export default function ListScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [capturing, setCapturing] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<FieldItem | null>(null);
  const [confirmDeleteList, setConfirmDeleteList] = useState(false);
  const [activePhoto, setActivePhoto] = useState<FieldItem | null>(null);

  const list = useLiveQuery(() => (id ? db.lists.get(id) : undefined), [id]);
  const items = useLiveQuery(
    () => (id ? db.items.where("listId").equals(id).sortBy("number") : []),
    [id]
  );

  if (list === null) {
    return (
      <div className="list-screen">
        <p className="list-screen__missing">This list no longer exists.</p>
        <button type="button" className="btn btn--primary" onClick={() => navigate("/")}>
          Back home
        </button>
      </div>
    );
  }

  async function handleDeleteItem() {
    if (!pendingDeleteItem) return;
    await deleteItem(pendingDeleteItem.id);
    setPendingDeleteItem(null);
    showToast("Photo deleted");
  }

  async function handleDeleteList() {
    if (!id) return;
    await deleteList(id);
    navigate("/");
    showToast(`Deleted "${list?.name}"`);
  }

  return (
    <div className="list-screen">
      <header className="list-screen__header">
        <button
          type="button"
          className="icon-btn"
          onClick={() => navigate("/")}
          aria-label="Back to lists"
        >
          <IconBack />
        </button>
        <div className="list-screen__title-wrap">
          <h1 className="list-screen__title">{list?.name ?? "…"}</h1>
          <span className="stamp list-screen__count">
            {items?.length ?? 0} item{(items?.length ?? 0) === 1 ? "" : "s"}
          </span>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setConfirmDeleteList(true)}
          aria-label="Delete list"
        >
          <IconTrash />
        </button>
      </header>

      <main className="list-screen__content">
        {items && items.length === 0 && (
          <div className="home__empty">
            <p>No items yet.</p>
            <p className="home__empty-sub">Tap the + button to add your first photo.</p>
          </div>
        )}

        <div className="item-grid">
          {items?.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className="item-card card-pop-in"
              style={{ "--i": index } as CSSProperties}
              onClick={() => setActivePhoto(item)}
            >
              <span className="item-card__photo-wrap">
                <PhotoImage
                  blob={item.photoBlob}
                  alt={item.caption}
                  className="item-card__photo"
                />
                <span className="item-card__number stamp">#{item.number}</span>
                <span className={`item-card__type item-card__type--${item.entryType ?? "gift"}`}>
                  {item.entryType === "cash" ? "💵" : "🎁"}
                </span>
              </span>
              <span className="item-card__caption">{item.caption}</span>
              <span className="item-card__timestamp stamp">{formatTimestamp(item.createdAt)}</span>
            </button>
          ))}
        </div>
      </main>

      <button
        type="button"
        className="fab fab--primary"
        onClick={() => setCapturing(true)}
        aria-label="Add photo"
      >
        <IconPlus />
      </button>

      {capturing && id && (
        <CaptureFlow
          mode="add-item"
          listId={id}
          onDone={() => setCapturing(false)}
          onCancel={() => setCapturing(false)}
        />
      )}

      {activePhoto && (
        <div className="photo-viewer" onClick={() => setActivePhoto(null)}>
          <button
            type="button"
            className="capture-review__close"
            onClick={() => setActivePhoto(null)}
            aria-label="Close"
          >
            <IconClose />
          </button>
          <PhotoImage
            blob={activePhoto.photoBlob}
            alt={activePhoto.caption}
            className="photo-viewer__image"
          />
          <div className="photo-viewer__footer" onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="photo-viewer__caption">
                #{activePhoto.number} — {activePhoto.caption}{" "}
                <span className="photo-viewer__type">
                  {activePhoto.entryType === "cash" ? "💵 Cash" : "🎁 Gift"}
                </span>
              </div>
              <div className="stamp photo-viewer__timestamp">
                {formatTimestamp(activePhoto.createdAt)}
              </div>
            </div>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => {
                setPendingDeleteItem(activePhoto);
                setActivePhoto(null);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {pendingDeleteItem && (
        <ConfirmDialog
          title="Delete this photo?"
          body={`Item #${pendingDeleteItem.number} will be permanently deleted and later items will be renumbered.`}
          onConfirm={handleDeleteItem}
          onCancel={() => setPendingDeleteItem(null)}
        />
      )}

      {confirmDeleteList && (
        <ConfirmDialog
          title="Delete this list?"
          body={`"${list?.name}" and all of its photos will be permanently deleted.`}
          onConfirm={handleDeleteList}
          onCancel={() => setConfirmDeleteList(false)}
        />
      )}
    </div>
  );
}
