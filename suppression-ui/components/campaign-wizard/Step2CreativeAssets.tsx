import React from "react";
import { FileText, ArrowRight, Save, Layers, Zap } from "lucide-react";
import { Select } from "./shared/FormComponents";

export default function Step2CreativeAssets({
  step, setStep, isFullscreen, handleSaveDraft,
  form, setForm, creatives, subjects, fromLines, toggleSelection,
  testIds, handleTestFire, loading, currentTestIndex,
  showAdvanced, setShowAdvanced
}: any) {
  if (step !== 2 && !isFullscreen) return null;

  return (
    <div className={`block space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`bg-secondary/20 border border-border/40 rounded-3xl p-8 backdrop-blur-md ${isFullscreen ? "fixed inset-0 z-[100] bg-background p-0 rounded-none flex flex-col" : ""}`}>
        {!isFullscreen && (
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                <FileText className="w-6 h-6" />
              </div>
              2. Creative Assets & Validation
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={handleSaveDraft} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary/50 text-sm font-bold hover:bg-secondary transition-all">
                <Save className="w-4 h-4" /> Save
              </button>
              <button onClick={() => setStep(3)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:scale-105 transition-all shadow-lg shadow-primary/20">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {!isFullscreen && (
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-background/40 border border-border/40 rounded-[2rem] p-6 backdrop-blur-md">
                <Select
                  label="Main Creative"
                  value={form.creativeId}
                  onChange={v => setForm({ ...form, creativeId: v })}
                  options={creatives.map((c: any) => ({ value: c._id, label: c.name || c.creativeName || "Unnamed Creative" }))}
                />
              </div>

              <div className="bg-background/40 border border-border/40 rounded-[2rem] p-6 backdrop-blur-md">
                <label className="text-[13px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1 mb-4 block">Subject Rotation ({form.subjectIds.length})</label>
                <div className="h-[120px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-border pr-2">
                  {subjects?.map((s: any) => (
                    <div
                      key={s._id}
                      onClick={() => toggleSelection(s._id, "subjectIds")}
                      className={`p-3 rounded-xl border cursor-pointer text-[15px] font-medium transition-all ${form.subjectIds.includes(s._id) ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-secondary/5 border-border/10 hover:border-primary/40 text-muted-foreground"
                        }`}
                    >
                      {s.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-background/40 border border-border/40 rounded-[2rem] p-6 backdrop-blur-md">
                <label className="text-[13px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1 mb-4 block">From Line Rotation ({form.fromIds.length})</label>
                <div className="h-[120px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-border pr-2">
                  {fromLines?.map((f: any) => (
                    <div
                      key={f._id}
                      onClick={() => toggleSelection(f._id, "fromIds")}
                      className={`p-3 rounded-xl border cursor-pointer text-[15px] font-medium transition-all ${form.fromIds.includes(f._id) ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-secondary/5 border-border/10 hover:border-primary/40 text-muted-foreground"
                        }`}
                    >
                      {f.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-[2rem] p-6">
                <h3 className="text-[13px] font-bold text-primary flex items-center gap-2 mb-4 uppercase tracking-[0.15em]">
                  <Zap className="w-4 h-4 fill-primary" /> Safety Fire Test Protocol
                </h3>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap gap-2 min-h-[50px] bg-panel/30 border border-border/40 rounded-2xl p-4">
                    {testIds.length === 0 ? (
                      <span className="text-[11px] text-text-muted opacity-50 italic">No authorized Test IDs found. Add them in Admin section.</span>
                    ) : (
                      testIds.map((id: any) => {
                        const isSelected = form.testEmails.includes(id.email);
                        return (
                          <button
                            key={id._id}
                            onClick={() => {
                              const next = isSelected
                                ? form.testEmails.filter((e: string) => e !== id.email)
                                : [...form.testEmails, id.email];
                              setForm({ ...form, testEmails: next });
                            }}
                            className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all border ${isSelected ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-background/40 border-border/40 text-text-secondary hover:bg-background/60"}`}
                          >
                            {id.email}
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <button onClick={handleTestFire} disabled={loading || form.testEmails.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 h-12 rounded-xl text-[12px] font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20 whitespace-nowrap">
                      {loading
                        ? `Sending ${currentTestIndex}/${form.testEmails.length}...`
                        : `Execute Test (${form.testEmails.length})`
                      }
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-secondary/10 border border-border/40 rounded-[2rem] p-6 flex items-center justify-between px-10">
                <div className="flex gap-10">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Active ID</span>
                    <span className="text-[16px] font-medium text-primary">{form.creativeId.slice(-8) || "NO_DATA"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">Selected Assets</span>
                    <span className="text-[16px] font-medium text-foreground">{form.subjectIds.length} Subjects / {form.fromIds.length} From</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`px-8 py-3.5 rounded-xl text-[11px] font-black transition-all border whitespace-nowrap flex items-center gap-2 ${showAdvanced ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 border-primary" : "bg-secondary/30 border-border/40 text-text-secondary hover:bg-secondary/50"}`}
                >
                  <Layers className="w-4 h-4" />
                  {showAdvanced ? "HIDE ADVANCED" : "ADVANCED CONFIG"}
                </button>
              </div>
            </div>

            {showAdvanced && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-background/40 border border-border/40 rounded-[2rem] p-8 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[13px] font-bold text-text-secondary uppercase tracking-[0.15em] flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Message Header Configuration
                    </h3>
                    <div className="flex items-center gap-4 bg-secondary/30 p-1 rounded-xl border border-border/20">
                      <button
                        onClick={() => setForm({ ...form, headerMode: "default" })}
                        className={`px-6 py-2 rounded-lg text-[11px] font-bold transition-all ${form.headerMode === "default" ? "bg-primary text-primary-foreground shadow-lg" : "text-text-secondary hover:bg-secondary/50"}`}
                      >
                        DEFAULT HEADERS
                      </button>
                      <button
                        onClick={() => {
                          const defaultHeaders = "Date: {date}\nFrom: {fromName} <{fromEmail}>\nTo: <{to}>\nReply-To: {replyTo}\nSubject: {subject}\nMessage-ID: {mid}\nMIME-Version: 1.0\nList-Unsubscribe: <{listUnsubUrl}>\nList-Unsubscribe-Post: List-Unsubscribe=One-Click\nContent-Type: multipart/alternative; boundary=\"{boundary}\"\nX-virtual-MTA: {vmta}";
                          setForm({
                            ...form,
                            headerMode: "custom",
                            customHeaderBlock: form.customHeaderBlock || defaultHeaders
                          });
                        }}
                        className={`px-6 py-2 rounded-lg text-[11px] font-bold transition-all ${form.headerMode === "custom" ? "bg-primary text-primary-foreground shadow-lg" : "text-text-secondary hover:bg-secondary/50"}`}
                      >
                        CUSTOM HEADERS
                      </button>
                    </div>
                  </div>

                  {form.headerMode === "custom" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {[
                          { label: "+ Date", value: "Date: {date}\n" },
                          { label: "+ From", value: "From: {fromName} <{fromEmail}>\n" },
                          { label: "+ To", value: "To: <{to}>\n" },
                          { label: "+ Subject", value: "Subject: {subject}\n" },
                          { label: "+ Reply-To", value: "Reply-To: {replyTo}\n" },
                          { label: "+ List-Unsubscribe", value: "List-Unsubscribe: <{listUnsubUrl}>\nList-Unsubscribe-Post: List-Unsubscribe=One-Click\n" },
                          { label: "+ MIME-Version", value: "MIME-Version: 1.0\n" },
                          { label: "+ Content-Type", value: 'Content-Type: multipart/alternative; boundary="{boundary}"\n' },
                          { label: "+ X-Mailer", value: "X-Mailer: {mailer}\n" },
                          { label: "+ X-virtual-MTA", value: "X-virtual-MTA: {vmta}\n" },
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            onClick={() => setForm({ ...form, customHeaderBlock: form.customHeaderBlock + chip.value })}
                            className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary hover:bg-primary/20 transition-all"
                          >
                            {chip.label}
                          </button>
                        ))}
                        <button
                          onClick={() => setForm({ ...form, customHeaderBlock: "" })}
                          className="px-3 py-1.5 rounded-full bg-rose/10 border border-rose/20 text-[10px] font-bold text-rose hover:bg-rose/20 transition-all ml-auto"
                        >
                          CLEAR ALL
                        </button>
                      </div>
                      <textarea
                        value={form.customHeaderBlock}
                        onChange={(e) => setForm({ ...form, customHeaderBlock: e.target.value })}
                        placeholder="X-Mailer: MyCustomMailer\nX-Complaints-To: abuse@domain.com\n..."
                        className="w-full bg-background/60 border border-border/40 rounded-2xl p-6 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[150px] resize-y"
                        spellCheck={false}
                      />
                      <p className="text-[11px] text-muted-foreground mt-3 ml-1 italic opacity-60 font-medium">
                        Enter one header per line. These will be injected into the message envelope.
                      </p>
                    </div>
                  )}
                  {form.headerMode === "default" && (
                    <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl animate-in fade-in duration-300">
                      <p className="text-[12px] text-primary/80 font-medium leading-relaxed">
                        System will use standard RFC-compliant headers optimized for high deliverability. This includes automated X-Job, X-Sender, and List-Unsubscribe headers where applicable.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-background/40 border border-border/40 rounded-[2rem] p-8 backdrop-blur-md">
                  <h3 className="text-[13px] font-bold text-text-secondary uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-primary" /> MIME Part Encoding Strategy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 text-left">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest ml-1 opacity-70">Text Part Encoding</label>
                      <div className="flex flex-wrap gap-2">
                        {["base64", "quoted-printable", "8bit", "7bit"].map((enc) => (
                          <button
                            key={enc}
                            onClick={() => setForm({ ...form, textEncoding: enc })}
                            className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all ${form.textEncoding === enc ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "bg-secondary/30 text-text-secondary hover:bg-secondary/50 border border-border/20"}`}
                          >
                            {enc.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4 text-left">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-widest ml-1 opacity-70">HTML Part Encoding</label>
                      <div className="flex flex-wrap gap-2">
                        {["base64", "quoted-printable", "8bit", "7bit"].map((enc) => (
                          <button
                            key={enc}
                            onClick={() => setForm({ ...form, htmlEncoding: enc })}
                            className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition-all ${form.htmlEncoding === enc ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "bg-secondary/30 text-text-secondary hover:bg-secondary/50 border border-border/20"}`}
                          >
                            {enc.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
