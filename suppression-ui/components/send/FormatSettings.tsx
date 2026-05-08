import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
interface FormatSettingsProps {
  formatOpen: boolean;
  setFormatOpen: (v: boolean) => void;

  contentMode: "multipart" | "html";
  setContentMode: (v: "multipart" | "html") => void;

  textEncoding: "base64" | "quoted-printable" | "7bit";
  setTextEncoding: (v: "base64" | "quoted-printable" | "7bit") => void;

  htmlEncoding: "base64" | "quoted-printable" | "7bit";
  setHtmlEncoding: (v: "base64" | "quoted-printable" | "7bit") => void;
}

export default function FormatSettings({
  formatOpen,
  setFormatOpen,
  contentMode,
  setContentMode,
  textEncoding,
  setTextEncoding,
  htmlEncoding,
  setHtmlEncoding,
}: FormatSettingsProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
      <div
        className="flex items-center cursor-pointer"
        onClick={() => setFormatOpen(!formatOpen)}
      >
        <h3 className="text-lg font-semibold flex-1">
          📧 Email Format
        </h3>
        <span className="text-lg text-muted-foreground">
          {formatOpen ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
        </span>
      </div>

      {formatOpen && (
        <div style={{ marginTop: 16 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Content Mode">
              <select
                value={contentMode}
                onChange={(e) =>
                  setContentMode(e.target.value as "multipart" | "html")
                }
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
              >
                <option value="multipart">Multipart</option>
                <option value="html">HTML Only</option>
              </select>
            </Field>

            <Field label="Text Encoding">
              <select
                value={textEncoding}
                onChange={(e) =>
                  setTextEncoding(
                    e.target.value as "base64" | "quoted-printable" | "7bit"
                  )
                }
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
              >
                <option value="base64">Base64</option>
                <option value="quoted-printable">Quoted Printable</option>
                <option value="7bit">7bit</option>
              </select>
            </Field>

            <Field label="HTML Encoding">
              <select
                value={htmlEncoding}
                onChange={(e) =>
                  setHtmlEncoding(
                    e.target.value as "base64" | "quoted-printable" | "7bit"
                  )
                }
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
              >
                <option value="base64">Base64</option>
                <option value="quoted-printable">Quoted Printable</option>
                <option value="7bit">7bit</option>
              </select>
            </Field>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="block text-sm text-muted-foreground mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

/* styles */

const sectionStyle: React.CSSProperties = {
  background: "#1f2937",
  padding: 24,
  borderRadius: 16,
  marginBottom: 24,
  border: "1px solid #374151",
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  margin: 0,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #374151",
  background: "#0f172a",
  color: "#fff",
};