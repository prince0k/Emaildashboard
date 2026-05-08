"use client";

import { useEffect, useState } from "react";
import {
  listSubjectLines,
  createSubjectLine,
  updateSubjectLine,
  deleteSubjectLine,
  bulkCreateSubjectLines,
} from "@/lib/subjectLineApi";
import { Edit, Trash2, Plus, Check, X } from "lucide-react";

export default function SubjectLineManager({ offerId }) {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(null);

  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const load = async () => {
    try {
      const data = await listSubjectLines(offerId);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load subject lines", err);
    }
  };

  useEffect(() => {
    load();
  }, [offerId]);

  const save = async () => {
    if (!text.trim()) return;

    try {
      if (editing) {
        const updated = await updateSubjectLine(editing._id, { text });
        setItems((prev) =>
          prev.map((i) => (i._id === editing._id ? updated : i))
        );
        setEditing(null);
      } else {
        const created = await createSubjectLine({ offerId, text });
        setItems((prev) => [created, ...prev]);
      }
      setText("");
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete subject line?")) return;

    try {
      await deleteSubjectLine(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkText.trim()) return;

    try {
      setBulkLoading(true);
      setBulkResult(null);

      const data = await bulkCreateSubjectLines({
        offerId,
        textBlock: bulkText,
      });

      setBulkResult(data);
      setBulkText("");
      load();
    } catch (err) {
      console.error("Bulk insert failed", err);
    } finally {
      setBulkLoading(false);
    }
  };

  const detectedLines = bulkText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean).length;

  return (
    <div className="space-y-8">

      {/* BULK ADD */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-6 space-y-4 shadow-soft">
        <div>
          <h3 className="text-sm font-semibold">Bulk Add Subject Lines</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Paste multiple lines. One per line.
          </p>
        </div>

        <textarea
          rows={6}
          placeholder="Line 1&#10;Line 2&#10;Line 3..."
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          className="
            w-full
            bg-background
            border border-border/60
            rounded-xl
            p-3
            text-sm
            focus:outline-none focus:ring-2 focus:ring-primary/40
            transition
          "
        />

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{detectedLines} lines detected</span>

          <button
            onClick={handleBulkSubmit}
            disabled={bulkLoading || detectedLines === 0}
            className="
              px-4 py-2
              rounded-xl
              text-xs font-semibold
              bg-primary text-primary-foreground
              hover:opacity-90
              disabled:opacity-50
              transition
            "
          >
            {bulkLoading ? "Adding..." : "Add All"}
          </button>
        </div>

        {bulkResult && (
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {bulkResult.inserted || 0} new subject lines added
          </div>
        )}
      </div>

      {/* SINGLE ADD */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-6 shadow-soft space-y-4">
        <h3 className="text-sm font-semibold">
          {editing ? "Edit Subject Line" : "Add Subject Line"}
        </h3>

        <div className="flex gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter subject line"
            className="
              flex-1
              bg-background
              border border-border/60
              rounded-xl
              p-3
              text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/40
              transition
            "
          />

          <button
            onClick={save}
            className="
              px-4
              rounded-xl
              bg-primary
              text-primary-foreground
              hover:opacity-90
              transition
            "
          >
            {editing ? <Check size={16} /> : <Plus size={16} />}
          </button>

          {editing && (
            <button
              onClick={() => {
                setEditing(null);
                setText("");
              }}
              className="
                px-4
                rounded-xl
                border border-border/60
                bg-muted
                text-muted-foreground
                hover:bg-muted/70
                transition
              "
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl shadow-soft overflow-hidden">
        {items.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No subject lines yet
          </div>
        )}

        {items.map((s) => (
          <div
            key={s._id}
            className="
              flex items-center justify-between
              px-5 py-3
              border-b border-border/50
              last:border-b-0
              hover:bg-muted/40
              transition
            "
          >
            <span className="text-sm text-foreground break-words">
              {s.text}
            </span>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditing(s);
                  setText(s.text);
                }}
                className="p-2 rounded-lg hover:bg-muted/60 transition"
              >
                <Edit size={14} className="text-primary" />
              </button>

              <button
                onClick={() => handleDelete(s._id)}
                className="p-2 rounded-lg hover:bg-muted/60 transition"
              >
                <Trash2 size={14} className="text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}