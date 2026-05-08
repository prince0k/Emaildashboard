import React from "react";

interface ConfirmModalProps {
  visible: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  visible,
  message,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!visible) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginTop: 0 }}>Confirm Live Send</h3>

        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#1f2937",
            padding: 12,
            borderRadius: 8,
            color: "#d1d5db",
          }}
        >
          {message}
        </pre>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
          <button onClick={onCancel} style={buttonStyle(false)}>
            Cancel
          </button>

          <button onClick={onConfirm} style={buttonStyle(true)}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

/* styles */

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: "#1f2937",
  padding: 24,
  borderRadius: 16,
  maxWidth: 500,
  width: "90%",
  border: "1px solid #374151",
};

const buttonStyle = (primary: boolean): React.CSSProperties => ({
  padding: "10px 20px",
  borderRadius: 30,
  border: "none",
  background: primary ? "#22c55e" : "#4b5563",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
});