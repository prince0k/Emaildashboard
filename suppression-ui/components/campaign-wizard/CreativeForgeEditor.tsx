import React from "react";
import { Layers, Zap } from "lucide-react";

export default function CreativeForgeEditor({
  step, isFullscreen, setIsFullscreen, creatives, form,
  htmlOverride, setHtmlOverride, formatHTML,
  showPreview, setShowPreview, currentServer,
  editorRef, gutterRef
}: any) {
  if (step !== 2 && !isFullscreen) return null;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const value = e.currentTarget.value;

      const newValue = value.substring(0, start) + "  " + value.substring(end);
      setHtmlOverride(newValue);

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-[100] bg-background p-0 rounded-none h-screen flex flex-col overflow-hidden" : "space-y-4"}`}>
      <div className={`flex items-center justify-between px-6 ${isFullscreen ? "py-4 bg-secondary/5 border-b border-border/20" : ""}`}>
        <label className="text-[13px] font-bold text-muted-foreground uppercase tracking-[0.15em]">Full Width Creative Source Power Editor</label>
        <div className="flex items-center gap-4">
          <div className="text-[11px] font-bold text-emerald bg-emerald/10 px-4 py-1.5 rounded-full border border-emerald/20">CONNECTED</div>
          <div className="text-[11px] font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">LIVE PREVIEW ACTIVE</div>
        </div>
      </div>

      <div className={`bg-panel border-border/60 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col ${isFullscreen ? "flex-1 min-h-0 rounded-none border-none" : "rounded-[3rem] border overflow-hidden h-[calc(100vh-100px)] min-h-[1200px]"}`}>
        <div className="bg-muted/30 px-10 py-5 border-b border-border/40 flex items-center justify-between flex-shrink-0">
          <div className="flex gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-rose shadow-lg shadow-rose/20"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-amber shadow-lg shadow-amber/20"></div>
            <div className="w-3.5 h-3.5 rounded-full bg-emerald shadow-lg shadow-emerald/20"></div>
          </div>
          <div className="text-[13px] font-bold uppercase tracking-[0.4em] opacity-40">Creative Forge v3.0 · Full Width Suite</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black transition-all ${isFullscreen ? "bg-rose text-white shadow-lg shadow-rose/20" : "bg-emerald/10 text-emerald border border-emerald/20 hover:bg-emerald/20"}`}
            >
              {isFullscreen ? <><Layers className="w-3 h-3" /> EXIT FULLSCREEN</> : <><Zap className="w-3 h-3" /> FULL SCREEN VIEW</>}
            </button>
            <div className="w-px h-4 bg-border/40 mx-2"></div>
            <button
              onClick={() => {
                const baseCreative = creatives.find((c: any) => c._id === form.creativeId);
                const templateHtml = baseCreative?.html || "";

                if (confirm("Reset to original creative template? All current edits will be lost.")) {
                  setHtmlOverride(templateHtml);
                }
              }}
              className="px-4 py-1.5 rounded-full text-[10px] font-black bg-rose/10 text-rose border border-rose/20 hover:bg-rose/20 transition-all"
            >
              RESET SOURCE
            </button>
            <div className="w-px h-4 bg-border/40 mx-2"></div>
            <button
              onClick={formatHTML}
              className="px-4 py-1.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
            >
              BEAUTIFY SOURCE
            </button>
            <div className="w-px h-4 bg-border/40 mx-2"></div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${showPreview ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"}`}
            >
              {showPreview ? "VIEW SOURCE" : "LIVE PREVIEW"}
            </button>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold opacity-20 uppercase tracking-widest">UTF-8</span>
              <span className="text-[13px] font-bold opacity-40">NORMALIZED</span>
            </div>
            <div className="w-px h-6 bg-border/40"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold opacity-20 uppercase tracking-widest">Line Count</span>
              <span className="text-[13px] font-bold opacity-40 text-primary">{htmlOverride.split('\n').length}</span>
            </div>
          </div>
        </div>
        {showPreview ? (
          <div className="w-full flex-1 bg-surface relative overflow-hidden">
            <iframe
              title="Creative Preview"
              srcDoc={(() => {
                let host = currentServer?.routes?.find((r: any) => form.routeIds.includes(r._id))?.domain || currentServer?.routes?.[0]?.domain || "";
                if (host && !host.startsWith('http')) host = `http://${host}`;
                return htmlOverride.replace(/\{\{IMAGE_HOST\}\}/gi, host);
              })()}
              className="absolute inset-0 w-full h-full border-none"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts"
            />
          </div>
        ) : (
          <div className="w-full flex-1 min-h-0 bg-transparent overflow-auto relative group custom-scrollbar">
            <div className="flex min-h-full">
              <div
                className="w-[64px] bg-panel/30 border-r border-border/10 flex flex-col py-14 select-none shrink-0"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: '15px',
                  lineHeight: '28px'
                }}
              >
                {htmlOverride.split('\n').map((_: any, i: number) => (
                  <div key={i} className="opacity-20 text-right pr-4 h-[28px]">
                    {i + 1}
                  </div>
                ))}
              </div>

              <textarea
                ref={editorRef}
                value={htmlOverride}
                onChange={(e) => setHtmlOverride(e.target.value)}
                onKeyDown={handleEditorKeyDown}
                onScroll={handleScroll}
                className="flex-1 bg-transparent p-14 py-14 text-[15px] focus:outline-none transition-all resize-none text-foreground placeholder:opacity-5 whitespace-pre border-none ring-0 outline-none"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  lineHeight: '28px',
                  height: Math.max(1200, htmlOverride.split('\n').length * 28 + 112) + 'px'
                }}
                placeholder="Drop your HTML campaign source here..."
                spellCheck={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
