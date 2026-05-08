import React from "react";

interface AdvancedHeaderSettingsProps {
  headerAdvancedOpen: boolean;
  setHeaderAdvancedOpen: (v: boolean) => void;

  headerBlockMode: "default" | "custom";
  setHeaderBlockMode: (v: "default" | "custom") => void;

  customHeaderBlock: string;
  setCustomHeaderBlock: (v: string) => void;

  envelopeMode: "route" | "random" | "custom";
  setEnvelopeMode: (v: "route" | "random" | "custom") => void;

  envelopeCustomType: "fixed" | "pattern";
  setEnvelopeCustomType: (v: "fixed" | "pattern") => void;

  envelopeCustomEmail: string;
  setEnvelopeCustomEmail: (v: string) => void;

  envelopeCustomDomain: string;
  setEnvelopeCustomDomain: (v: string) => void;

  envelopePatternBlocks: number;
  setEnvelopePatternBlocks: (v: number) => void;

  envelopePatternLength: number;
  setEnvelopePatternLength: (v: number) => void;

  headerMode: "route" | "random" | "custom";
  setHeaderMode: (v: "route" | "random" | "custom") => void;

  headerCustomType: "fixed" | "pattern";
  setHeaderCustomType: (v: "fixed" | "pattern") => void;

  headerCustomEmail: string;
  setHeaderCustomEmail: (v: string) => void;

  headerCustomDomain: string;
  setHeaderCustomDomain: (v: string) => void;

  headerPatternBlocks: number;
  setHeaderPatternBlocks: (v: number) => void;

  headerPatternLength: number;
  setHeaderPatternLength: (v: number) => void;
}

export default function AdvancedHeaderSettings(props: AdvancedHeaderSettingsProps) {
  const {
    headerAdvancedOpen,
    setHeaderAdvancedOpen,
    headerBlockMode,
    setHeaderBlockMode,
    customHeaderBlock,
    setCustomHeaderBlock,
    envelopeMode,
    setEnvelopeMode,
    envelopeCustomType,
    setEnvelopeCustomType,
    envelopeCustomEmail,
    setEnvelopeCustomEmail,
    envelopeCustomDomain,
    setEnvelopeCustomDomain,
    envelopePatternBlocks,
    setEnvelopePatternBlocks,
    envelopePatternLength,
    setEnvelopePatternLength,
    headerMode,
    setHeaderMode,
    headerCustomType,
    setHeaderCustomType,
    headerCustomEmail,
    setHeaderCustomEmail,
    headerCustomDomain,
    setHeaderCustomDomain,
    headerPatternBlocks,
    setHeaderPatternBlocks,
    headerPatternLength,
    setHeaderPatternLength,
  } = props;

  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
      <div
       className="flex items-center cursor-pointer"
        onClick={() => setHeaderAdvancedOpen(!headerAdvancedOpen)}
      >
        <h3 className="text-lg font-semibold flex-1">
          🔧 Advanced Header Settings
        </h3>
        <span className="text-lg text-muted-foreground">
          {headerAdvancedOpen ? "▼" : "▶"}
        </span>
      </div>

      {/* HEADER BLOCK MODE */}
      <Field label="Header Block Mode">
        <select
          value={headerBlockMode}
          onChange={(e) =>
            setHeaderBlockMode(e.target.value as "default" | "custom")
          }
          className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
        >
          <option value="default">Default Header</option>
          <option value="custom">Custom Full Header</option>
        </select>
      </Field>

      {headerBlockMode === "custom" && (
        <Field label="Custom Header Block">
          <textarea
            value={customHeaderBlock}
            onChange={(e) => setCustomHeaderBlock(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2 font-mono"
          />
        </Field>
      )}

      {headerAdvancedOpen && (
        <>
          <SubCard title="Envelope">
            <ModeSelect
              value={envelopeMode}
              setValue={setEnvelopeMode}
            />

            {envelopeMode === "custom" && (
              <>
                <TypeSelect
                  value={envelopeCustomType}
                  setValue={setEnvelopeCustomType}
                />

                {envelopeCustomType === "fixed" && (
                  <Field label="Fixed Email">
                    <input
                      value={envelopeCustomEmail}
                      onChange={(e) =>
                        setEnvelopeCustomEmail(e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
                    />
                  </Field>
                )}

                {envelopeCustomType === "pattern" && (
                  <>
                    <Field label="Custom Domain">
                      <input
                        value={envelopeCustomDomain}
                        onChange={(e) =>
                          setEnvelopeCustomDomain(e.target.value)
                        }
                        className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
                      />
                    </Field>

                    <NumberPair
                      blocks={envelopePatternBlocks}
                      setBlocks={setEnvelopePatternBlocks}
                      length={envelopePatternLength}
                      setLength={setEnvelopePatternLength}
                    />
                  </>
                )}
              </>
            )}
          </SubCard>

          <SubCard title="Header">
            <ModeSelect
              value={headerMode}
              setValue={setHeaderMode}
            />

            {headerMode === "custom" && (
              <>
                <TypeSelect
                  value={headerCustomType}
                  setValue={setHeaderCustomType}
                />

                {headerCustomType === "fixed" && (
                  <Field label="Fixed Header Email">
                    <input
                      value={headerCustomEmail}
                      onChange={(e) =>
                        setHeaderCustomEmail(e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
                    />
                  </Field>
                )}

                {headerCustomType === "pattern" && (
                  <>
                    <Field label="Custom Domain">
                      <input
                        value={headerCustomDomain}
                        onChange={(e) =>
                          setHeaderCustomDomain(e.target.value)
                        }
                        className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
                      />
                    </Field>

                    <NumberPair
                      blocks={headerPatternBlocks}
                      setBlocks={setHeaderPatternBlocks}
                      length={headerPatternLength}
                      setLength={setHeaderPatternLength}
                    />
                  </>
                )}
              </>
            )}
          </SubCard>
        </>
      )}
    </section>
  );
}

/* Helpers */

function Field({ label, children }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="block text-sm text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function ModeSelect({ value, setValue }: any) {
  return (
    <Field label="Mode">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
      >
        <option value="route">Route</option>
        <option value="random">Random</option>
        <option value="custom">Custom</option>
      </select>
    </Field>
  );
}

function TypeSelect({ value, setValue }: any) {
  return (
    <Field label="Custom Type">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
      >
        <option value="fixed">Fixed Email</option>
        <option value="pattern">Pattern</option>
      </select>
    </Field>
  );
}

function NumberPair({ blocks, setBlocks, length, setLength }: any) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field label="Blocks">
        <input
          type="number"
          value={blocks}
          onChange={(e) => setBlocks(Number(e.target.value))}
          className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
        />
      </Field>
      <Field label="Block Length">
        <input
          type="number"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
        />
      </Field>
    </div>
  );
}

function SubCard({ title, children }: any) {
  return (
    <div className="bg-background border border-border rounded-xl p-4 mt-4">
      <h4 className="font-semibold mb-3">{title}</h4>
      {children}
    </div>
  );
}