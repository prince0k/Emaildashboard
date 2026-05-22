import React from "react";
import { Users, Save, ArrowRight, Zap, Filter, CheckCircle2 } from "lucide-react";
import { SuppressionLayer, ConfirmItem, BreakdownItem } from "./shared/FormComponents";

export default function Step3Suppression({
  step, setStep, isFullscreen, handleSaveDraft,
  form, servers, segments, offers,
  suppressionConfig, setSuppressionConfig,
  suppressionResult, setSuppressionResult,
  suppressing, handleRunSuppression
}: any) {
  if (step !== 3 || isFullscreen) return null;

  return (
    <div className="block space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-secondary/20 border border-border/40 rounded-3xl p-8 backdrop-blur-md shadow-inner">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
              <Users className="w-6 h-6" />
            </div>
            3. Audience & Suppression
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveDraft} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary/50 text-sm font-bold hover:bg-secondary transition-all">
              <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={() => setStep(4)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-background/40 border border-border/40 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Queue Domain
              </h3>
              <div className="text-lg font-bold text-primary">
                {(() => {
                  const srv = servers.find((s: any) => s._id === form.sender);
                  const domain = suppressionConfig.queueDomain || srv?.routes?.[0]?.domain || "—";
                  return domain;
                })()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Auto-resolved from sender routes</p>
            </div>

            <div className="bg-background/40 border border-border/40 rounded-2xl p-6 space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" /> Suppression Pipeline
              </h3>

              <SuppressionLayer label="Global Suppression" active={true} locked={true} />
              <SuppressionLayer label="Offer MD5 (Optizmo)" active={true} locked={true} />
              <SuppressionLayer label="Global Complaints" active={true} locked={true} />
              <SuppressionLayer label="Domain Complaints" active={true} locked={true} />
              <SuppressionLayer
                label="Global Unsubs"
                active={!suppressionConfig.skipUnsub}
                locked={false}
                onToggle={() => setSuppressionConfig((prev: any) => ({ ...prev, skipUnsub: !prev.skipUnsub }))}
              />
              <SuppressionLayer
                label="Domain Unsubs"
                active={!suppressionConfig.skipUnsub}
                locked={false}
                onToggle={() => setSuppressionConfig((prev: any) => ({ ...prev, skipUnsub: !prev.skipUnsub }))}
              />
              <SuppressionLayer label="Hard Bounce" active={true} locked={true} />

              {suppressionConfig.skipUnsub && (
                <div className="mt-2 p-3 rounded-xl bg-amber/10 border border-amber/30 text-amber text-xs font-medium">
                  ⚠️ Unsub suppression disabled — previously unsubscribed users WILL receive emails.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-background/40 border border-border/40 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                📁 Available Segments
              </h3>
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {segments.map((seg: any) => {
                  const inInclusion = suppressionConfig.inclusionSegments.some((s: any) => s.filename === seg.file);
                  const inExclusion = suppressionConfig.exclusionSegments.some((s: any) => s.filename === seg.file);
                  const used = inInclusion || inExclusion;
                  return (
                    <div
                      key={seg.file}
                      draggable={!used}
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", seg.file); }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${used
                          ? "opacity-30 cursor-not-allowed bg-panel/20"
                          : "cursor-grab hover:bg-primary/10 bg-panel/10 active:scale-95"
                        }`}
                    >
                      <span className="truncate">{seg.file}</span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">{(seg.count || 0).toLocaleString()}</span>
                    </div>
                  );
                })}
                {segments.length === 0 && (
                  <div className="text-xs text-muted-foreground italic p-2">No segments available</div>
                )}
              </div>
            </div>

            {/* INCLUSION ZONE */}
            <div
              className="bg-emerald/5 border-2 border-dashed border-emerald/30 rounded-2xl p-5 min-h-[100px] transition-all"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-emerald", "bg-emerald/10"); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove("border-emerald", "bg-emerald/10"); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-emerald", "bg-emerald/10");
                const filename = e.dataTransfer.getData("text/plain");
                if (filename && !suppressionConfig.inclusionSegments.some((s: any) => s.filename === filename)) {
                  setSuppressionConfig((prev: any) => ({
                    ...prev,
                    inclusionSegments: [...prev.inclusionSegments, { filename, limit: 0, direction: "top" }],
                  }));
                }
              }}
            >
              <h4 className="text-xs font-bold text-emerald uppercase tracking-widest mb-3 flex items-center gap-2">
                ✅ Inclusion Zone
                <span className="text-[10px] font-normal text-muted-foreground/60 normal-case tracking-normal">
                  (limit direction is configurable)
                </span>
              </h4>
              {suppressionConfig.inclusionSegments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Drag segments here to include</p>
              ) : (
                <div className="space-y-2">
                  {suppressionConfig.inclusionSegments.map((seg: any, i: number) => (
                    <div key={seg.filename} className="flex items-center gap-2 bg-background/60 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium truncate flex-1">{seg.filename}</span>
                      {seg.limit > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 animate-in fade-in duration-300 ${seg.direction === "bottom"
                            ? "text-amber bg-amber/10 border border-amber/20"
                            : "text-primary bg-primary/10 border border-primary/20"
                          }`}>
                          {seg.direction === "bottom" ? "Bottom" : "Top"}
                        </span>
                      )}
                      <select
                        value={seg.direction || "top"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSuppressionConfig((prev: any) => {
                            const updated = [...prev.inclusionSegments];
                            updated[i] = { ...updated[i], direction: val };
                            return { ...prev, inclusionSegments: updated };
                          });
                        }}
                        className="bg-muted/40 border border-border/40 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                      >
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Limit"
                        title="Loads this number of records starting sequentially from the top or bottom of the file."
                        value={seg.limit || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setSuppressionConfig((prev: any) => {
                            const updated = [...prev.inclusionSegments];
                            updated[i] = { ...updated[i], limit: val };
                            return { ...prev, inclusionSegments: updated };
                          });
                        }}
                        className="w-16 bg-muted/30 border border-border/40 rounded-lg px-2 py-1 text-xs text-center"
                      />
                      <button
                        onClick={() => {
                          setSuppressionConfig((prev: any) => ({
                            ...prev,
                            inclusionSegments: prev.inclusionSegments.filter((_: any, idx: number) => idx !== i),
                          }));
                        }}
                        className="text-rose hover:text-rose/80 text-sm font-bold"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EXCLUSION ZONE */}
            <div
              className="bg-rose/5 border-2 border-dashed border-rose/30 rounded-2xl p-5 min-h-[100px] transition-all"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-rose", "bg-rose/10"); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove("border-rose", "bg-rose/10"); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-rose", "bg-rose/10");
                const filename = e.dataTransfer.getData("text/plain");
                if (filename && !suppressionConfig.exclusionSegments.some((s: any) => s.filename === filename)) {
                  setSuppressionConfig((prev: any) => ({
                    ...prev,
                    exclusionSegments: [...prev.exclusionSegments, { filename, limit: 0, direction: "top" }],
                  }));
                }
              }}
            >
              <h4 className="text-xs font-bold text-rose uppercase tracking-widest mb-3 flex items-center gap-2">
                🚫 Exclusion Zone
                <span className="text-[10px] font-normal text-muted-foreground/60 normal-case tracking-normal">
                  (limit direction is configurable)
                </span>
              </h4>
              {suppressionConfig.exclusionSegments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Drag segments here to exclude</p>
              ) : (
                <div className="space-y-2">
                  {suppressionConfig.exclusionSegments.map((seg: any, i: number) => (
                    <div key={seg.filename} className="flex items-center gap-2 bg-background/60 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium truncate flex-1">{seg.filename}</span>
                      {seg.limit > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 animate-in fade-in duration-300 ${seg.direction === "bottom"
                            ? "text-amber bg-amber/10 border border-amber/20"
                            : "text-primary bg-primary/10 border border-primary/20"
                          }`}>
                          {seg.direction === "bottom" ? "Bottom" : "Top"}
                        </span>
                      )}
                      <select
                        value={seg.direction || "top"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSuppressionConfig((prev: any) => {
                            const updated = [...prev.exclusionSegments];
                            updated[i] = { ...updated[i], direction: val };
                            return { ...prev, exclusionSegments: updated };
                          });
                        }}
                        className="bg-muted/40 border border-border/40 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                      >
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Limit"
                        title="Loads this number of records starting sequentially from the top or bottom of the file."
                        value={seg.limit || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setSuppressionConfig((prev: any) => {
                            const updated = [...prev.exclusionSegments];
                            updated[i] = { ...updated[i], limit: val };
                            return { ...prev, exclusionSegments: updated };
                          });
                        }}
                        className="w-16 bg-muted/30 border border-border/40 rounded-lg px-2 py-1 text-xs text-center"
                      />
                      <button
                        onClick={() => {
                          setSuppressionConfig((prev: any) => ({
                            ...prev,
                            exclusionSegments: prev.exclusionSegments.filter((_: any, idx: number) => idx !== i),
                          }));
                        }}
                        className="text-rose hover:text-rose/80 text-sm font-bold"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleRunSuppression}
            disabled={suppressing || !form.segmentName}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${suppressionResult
                ? "bg-emerald hover:opacity-90 text-primary-foreground"
                : "bg-primary hover:opacity-90 text-primary-foreground"
              } disabled:opacity-50`}
          >
            {suppressing ? "⏳ Running..." : suppressionResult ? "✅ Re-Run Suppression" : "🚀 Run Suppression"}
          </button>

          {!form.segmentName && (
            <span className="text-xs text-muted-foreground italic">Select a segment in Step 1 first</span>
          )}
        </div>

        {suppressionResult && !suppressing && (
          <div className="mt-8 bg-background/60 border border-emerald/30 rounded-2xl p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald" />
              Suppression Complete — Campaign Confirmation
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ConfirmItem label="Campaign" value={form.campaignName} />
              <ConfirmItem label="Offer" value={offers.find((o: any) => o._id === form.offerId)?.offer || "—"} />
              <ConfirmItem label="Sender" value={servers.find((s: any) => s._id === form.sender)?.name || "—"} />
              <ConfirmItem label="ISP" value={form.isp} />
              <ConfirmItem label="Segment" value={form.segmentName} />
              <ConfirmItem label="Queue Domain" value={suppressionConfig.queueDomain || servers.find((s: any) => s._id === form.sender)?.routes?.[0]?.domain || "—"} />
              <ConfirmItem label="Unsub Suppression" value={suppressionConfig.skipUnsub ? "OFF" : "ON"} />
              <ConfirmItem label="Inclusion Files" value={String(suppressionConfig.inclusionSegments.length)} />
            </div>

            <div className="bg-muted/20 rounded-xl p-5">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Suppression Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <BreakdownItem label="Input" value={suppressionResult.breakdown?.input} />
                <BreakdownItem label="Invalid" value={suppressionResult.breakdown?.invalid} negative />
                <BreakdownItem label="Duplicates" value={suppressionResult.breakdown?.duplicates} negative />
                <BreakdownItem label="Offer MD5" value={suppressionResult.breakdown?.offer_md5} negative />
                <BreakdownItem label="Global" value={suppressionResult.breakdown?.global} negative />
                <BreakdownItem label="Global Complaint" value={suppressionResult.breakdown?.complaint} negative />
                <BreakdownItem label="Domain Complaint" value={suppressionResult.breakdown?.domain_complaint} negative />
                <BreakdownItem label="Global Unsub" value={suppressionResult.breakdown?.unsubscribe} negative />
                <BreakdownItem label="Domain Unsub" value={suppressionResult.breakdown?.domain_unsub} negative />
                <BreakdownItem label="Bounce" value={suppressionResult.breakdown?.bounce} negative />
                <BreakdownItem label="Exclusion" value={suppressionResult.breakdown?.exclusion_removed} negative />
                <BreakdownItem label="Inclusion Added" value={suppressionResult.breakdown?.inclusion_added} positive />
              </div>
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Final Count</span>
                <span className="text-3xl font-black text-emerald">{(suppressionResult.finalCount || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald hover:opacity-90 text-primary-foreground text-sm font-bold transition-all shadow-lg shadow-emerald/20 hover:scale-105"
              >
                🚀 Proceed to Send <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleRunSuppression}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber/20 border border-amber/30 text-amber text-sm font-bold hover:bg-amber/30 transition-all"
              >
                🔁 Re-Run Suppression
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
