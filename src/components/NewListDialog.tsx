import { useState, type FormEvent } from "react";
import "./ConfirmDialog.css";

interface NewListDialogProps {
  onCreate: (name: string) => void;
  onCancel: () => void;
}

export default function NewListDialog({ onCreate, onCancel }: NewListDialogProps) {
  const [name, setName] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onCreate(name);
  }

  return (
    <div className="confirm-dialog__backdrop" onClick={onCancel}>
      <form
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-list-dialog-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="new-list-dialog-title" className="confirm-dialog__title">
          New list
        </h2>
        <label className="field new-list-dialog__field">
          <span className="field__label">List name</span>
          <input
            className="field__input field__input--heading"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wedding gifts"
            autoFocus
          />
        </label>
        <div className="confirm-dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
