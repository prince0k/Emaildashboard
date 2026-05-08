import React from "react";
import { useEffect } from "react";

interface ExecutionSettingsProps {
   campaign: any;
  mode: "TEST" | "LIVE";
  setMode: (v: "TEST" | "LIVE") => void;

  trackingMode: "from" | "domain";
  setTrackingMode: (v: "from" | "domain") => void;

  trackingDomain: string;
  setTrackingDomain: (v: string) => void;

  subject: string;
  setSubject: (v: string) => void;
  subjectOpen: boolean;
  setSubjectOpen: (v: boolean) => void;
  subjectQuery: string;
  setSubjectQuery: (v: string) => void;
  filteredSubjects: string[];

  fromName: string;
  setFromName: (v: string) => void;
  fromOpen: boolean;
  setFromOpen: (v: boolean) => void;
  fromQuery: string;
  setFromQuery: (v: string) => void;
  filteredFrom: string[];
  aliases: string;
  setAliases: (v: string) => void;
  seeds: string;
  setSeeds: (v: string) => void;

  totalSend: number;
  setTotalSend: (v: number) => void;

  seedAfter: number | "";
  setSeedAfter: (v: number | "") => void;

  seedMode: "round" | "random";
  setSeedMode: (v: "round" | "random") => void;

  sendInSeconds: number | "";
  setSendInSeconds: (v: number | "") => void;

  sendInMinutes: number | "";
  setSendInMinutes: (v: number | "") => void;

  sendInHours: number | "";
  setSendInHours: (v: number | "") => void;
  testRoutes: number | "";
  setTestRoutes: (v: number | "") => void;

  testSeeds: number | "";
  setTestSeeds: (v: number | "") => void;

  testTotalSend: number | "";
  setTestTotalSend: (v: number | "") => void;
  rate: number;

  suppressing: boolean;
  suppressed: boolean;
  suppressStats: any;
  runSuppression: () => void;
  reloadCampaign: () => Promise<void>;
  onSave: () => void;
}

export default function ExecutionSettings(props: ExecutionSettingsProps) {

  const [showSuppressionPopup, setShowSuppressionPopup] = React.useState(false);

  const {
    campaign,
    mode,
    setMode,
    trackingMode,
    setTrackingMode,
    trackingDomain,
    setTrackingDomain,
    testRoutes,
    setTestRoutes,
    testSeeds,
    setTestSeeds,
    testTotalSend,
    setTestTotalSend,
    aliases,
    setAliases,
    subject,
    setSubject,
    subjectOpen,
    setSubjectOpen,
    subjectQuery,
    setSubjectQuery,
    filteredSubjects,
    fromName,
    setFromName,
    fromOpen,
    setFromOpen,
    fromQuery,
    setFromQuery,
    filteredFrom,
    seeds,
    setSeeds,
    totalSend,
    setTotalSend,
    seedAfter,
    setSeedAfter,
    seedMode,
    setSeedMode,
    sendInSeconds,
    setSendInSeconds,
    sendInMinutes,
    setSendInMinutes,
    sendInHours,
    setSendInHours,
    rate,
    suppressing,
    suppressStats,
    runSuppression,
    reloadCampaign,
    onSave,
  } = props;

  // ✅ NOW SAFE
  const suppressed =
  campaign?.suppression?.status === "COMPLETED" ||
  campaign?.suppression?.isCompleted === true;

  useEffect(() => {
  const close = () => {
    setSubjectOpen(false);
    setFromOpen(false);
  };

  window.addEventListener("click", close);
  return () => window.removeEventListener("click", close);
}, []);

  return (
    <section className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">

      <h3 className="text-lg font-semibold">⚙️ Execution</h3>
      <button
  onClick={onSave}
  className="mt-4 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium"
>
  💾 Save Settings
</button>
      {/* MODE + TRACKING */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Field label="Mode">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
          >
            <option value="TEST">TEST</option>
            <option value="LIVE">LIVE</option>
          </select>
        </Field>

        <Field label="Tracking Mode">
          <select
            value={trackingMode}
            onChange={(e) => setTrackingMode(e.target.value as any)}
            className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
          >
            <option value="from">From Domain</option>
            <option value="domain">Custom Domain</option>
          </select>
        </Field>

      </div>

      {/* TRACKING DOMAIN */}

      {trackingMode === "domain" && (
        <Field label="Tracking Domain">
          <input
            value={trackingDomain}
            onChange={(e) => setTrackingDomain(e.target.value)}
            className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
            placeholder="track.domain.com"
          />
        </Field>
      )}

      {/* SUBJECT + FROM */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Field label="Subject">

          <div
  className="relative"
  onClick={(e) => e.stopPropagation()}
>

            <input
              value={subjectOpen ? subjectQuery : subject}
              onFocus={() => setSubjectOpen(true)}
              onChange={(e) => {
                setSubjectQuery(e.target.value);
                setSubject(e.target.value);
                setSubjectOpen(true);
              }}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
            />

            {subjectOpen && (
              <Dropdown>
                {filteredSubjects.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No subjects found
                  </div>
                )}
                {filteredSubjects.map((s, i) => (
                  <div
                    key={i}
                    className="dropdownItem"
                    onClick={() => {
                      setSubject(s);
                      setSubjectQuery("");
                      setSubjectOpen(false);
                    }}
                  >
                    {s}
                  </div>
                ))}
              </Dropdown>
            )}

          </div>

        </Field>

        <Field label="From Name">

          <div
  className="relative"
  onClick={(e) => e.stopPropagation()}
>

            <input
              value={fromOpen ? fromQuery : fromName}
              onFocus={() => setFromOpen(true)}
              onChange={(e) => {
                setFromQuery(e.target.value);
                setFromName(e.target.value);
                setFromOpen(true);
              }}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
            />

            {fromOpen && (
              <Dropdown>
                {filteredFrom.map((f, i) => (
                  <div
                    key={i}
                    className="dropdownItem"
                    onClick={() => {
                      setFromName(f);
                      setFromQuery("");
                      setFromOpen(false);
                    }}
                  >
                    {f}
                  </div>
                ))}
              </Dropdown>
            )}

          </div>

        </Field>

      </div>

      {/* ALIASES */}

<Field label="Aliases (optional)">
  <textarea
    value={aliases}
    placeholder={`support
offers
billing`}
    onChange={(e) => setAliases(e.target.value)}
    className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2"
  />

  <div className="text-xs text-muted-foreground mt-1">
    One alias per line (optional)
  </div>
</Field>

      {/* SEEDS */}

      <Field label="Seeds (comma separated)">
        <input
          value={seeds}
          placeholder="test@gmail.com, test2@gmail.com"
          onChange={(e) => {
  const value = e.target.value;
  setSeeds(value);
}}
          className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
        />
      </Field>
      {mode === "TEST" && (
  <div className="grid grid-cols-3 gap-4">

    <Field label="Test Routes">
      <input
        type="number"
        value={testRoutes}
        onChange={(e) =>
          setTestRoutes(e.target.value ? Number(e.target.value) : "")
        }
        className="w-full rounded-lg border border-border bg-background text-sm p-2"
        placeholder="limit routes"
      />
    </Field>

    <Field label="Test Seeds">
      <input
        type="number"
        value={testSeeds}
        onChange={(e) =>
          setTestSeeds(e.target.value ? Number(e.target.value) : "")
        }
        className="w-full rounded-lg border border-border bg-background text-sm p-2"
        placeholder="limit seeds"
      />
    </Field>

    <Field label="Test Total Send">
      <input
        type="number"
        value={testTotalSend}
        onChange={(e) =>
          setTestTotalSend(e.target.value ? Number(e.target.value) : "")
        }
        className="w-full rounded-lg border border-border bg-background text-sm p-2"
        placeholder="max mails"
      />
    </Field>

  </div>
)}

      {/* LIVE MODE SETTINGS */}

      {mode === "LIVE" && (
        <>

          <Field label="Total Send">
            <input
              type="number"
              value={totalSend}
              onChange={(e) => setTotalSend(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
            />
          </Field>

          

          {/* SEED SETTINGS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Field label="Seed After">
              <input
                type="number"
                value={seedAfter}
                onChange={(e) =>
                  setSeedAfter(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
              />
            </Field>

            <Field label="Seed Mode">
              <select
                value={seedMode}
                onChange={(e) => setSeedMode(e.target.value as any)}
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
              >
                <option value="round">Round</option>
                <option value="random">Random</option>
              </select>
            </Field>

          </div>

          {/* SEND SPEED */}

          <div className="grid grid-cols-3 gap-4">

            <Field label="Send In Seconds">
              <input
                type="number"
                value={sendInSeconds}
                onChange={(e) =>
                  setSendInSeconds(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
              />
            </Field>

            <Field label="Send In Minutes">
              <input
                type="number"
                value={sendInMinutes}
                onChange={(e) =>
                  setSendInMinutes(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
              />
            </Field>

            <Field label="Send In Hours">
              <input
                type="number"
                value={sendInHours}
                onChange={(e) =>
                  setSendInHours(
                    e.target.value ? Number(e.target.value) : ""
                  )
                }
                className="w-full rounded-lg border border-border bg-background text-foreground text-sm p-2" 
              />
            </Field>

          </div>

          {rate > 0 && (
            <div className="text-sm text-muted-foreground">
              Estimated rate: <b>{rate.toFixed(2)}</b> emails/sec
            </div>
          )}

<div className="flex items-center gap-3 mt-4">

  <button
    onClick={async () => {
  if (suppressing) return;

  await runSuppression();
  setShowSuppressionPopup(true);
}}
    disabled={suppressing}
    className={`px-4 py-2 rounded-lg text-white text-sm font-medium
      ${
        suppressed
          ? "bg-emerald-600 hover:bg-emerald-500"
          : "bg-blue-600 hover:bg-blue-500"
      }`}
  >
    {suppressing
      ? "Running..."
      : suppressed
      ? "Suppression Done ✅"
      : "Run Suppression"}
  </button>

  {suppressed && !suppressing && (
    <button
      onClick={async () => {
  if (suppressing) return;

  await runSuppression();
  setShowSuppressionPopup(true);
}}
      className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-medium"
    >
      🔁 Run Again
    </button>
  )}

</div>

         {showSuppressionPopup && campaign?.suppression && (() => {
  const s = campaign.suppression;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl p-6 w-[420px]">

        <h3 className="text-lg font-semibold mb-4">
          Suppression Result
        </h3>

        <div className="space-y-1 text-sm">

          <div>Original: {s.inputCount}</div>

          <div>Invalid: {s.breakdown?.invalid ?? 0}</div>
          <div>Duplicates: {s.breakdown?.duplicates ?? 0}</div>
          <div>Offer MD5: {s.breakdown?.offer_md5 ?? 0}</div>
          <div>Global: {s.breakdown?.global ?? 0}</div>
          <div>Unsubscribe: {s.breakdown?.unsubscribe ?? 0}</div>
          <div>Complaint: {s.breakdown?.complaint ?? 0}</div>
          <div>Bounce: {s.breakdown?.bounce ?? 0}</div>

          <div className="border-t pt-2 mt-2">
            <b>Final: {s.finalCount}</b>
          </div>

        </div>

        <button
          onClick={() => setShowSuppressionPopup(false)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Close
        </button>

      </div>
    </div>
  );
})()}

        </>
      )}
    </section>
  );
}

/* ---------- small reusable components ---------- */

function Field({ label, children }: any) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Dropdown({ children }: any) {
  return (
    <div className="absolute mt-1 w-full rounded-lg border border-border bg-card shadow-lg max-h-40 overflow-y-auto z-50">
      {children}
    </div>
  );
}