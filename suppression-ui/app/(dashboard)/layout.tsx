import Sidebar from "../../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground">
      
      {/* ===== SIDEBAR ===== */}
      <Sidebar />

      {/* ===== MAIN AREA ===== */}
      <div className="flex-1 flex flex-col">

        {/* ===== TOP BAR ===== */}
        <header className="
          h-16 
          border-b border-border/60 
          bg-background/70 
          backdrop-blur-xl 
          supports-[backdrop-filter]:bg-background/60
          sticky top-0 z-40
        ">
          <div className="h-full flex items-center justify-between px-6 md:px-8">
            
            {/* Left */}
            <div className="flex items-center gap-4">
              <h1 className="text-base md:text-lg font-semibold tracking-tight">
                Operations Console
              </h1>
              <span className="hidden md:inline text-xs text-muted-foreground">
                Campaign & Offer Management
              </span>
            </div>

            {/* Right (placeholder for future controls) */}
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                OC
              </div>
            </div>

          </div>
        </header>

        {/* ===== PAGE CONTENT ===== */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}