"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { getPmtaStats } from "@/lib/pmtaApi";
import PmtaGraph from "@/components/pmta/PmtaGraph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Server,
  Hash,
  Clock,
  AlertCircle,
  BarChart3,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  Power,
  RotateCw,
  RefreshCw,
  Eye,
} from "lucide-react";
import TrafficTable from "@/components/pmta/TrafficTable";

type DomainGroup = {
  domain: string;
  total: number;
  items: any[];
};
type CommandResult = {
  status?: string
  action?: string
  output?: string[]
  [key: string]: any
}

export default function ServerDetail() {
  const { id } = useParams();
  const [server, setServer] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [runAll, setRunAll] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [cmdResult, setCmdResult] = useState<CommandResult | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const runCommand = useCallback(
    async (action: string, target: string = "", source_ip: string = "") => {
      setPendingAction(action);
      try {
        const res = await fetch("/api/pmta/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, target, source_ip, serverId: id, runAll }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`Command "${action}" executed successfully`);
        } else {
          toast.error(data.error || `Command "${action}" failed`);
        }
        setCmdResult(data)
        console.log("CMD RESULT:", data);
      } catch (err) {
        console.error("Command failed", err);
        toast.error("Network error while executing command");
      } finally {
        setPendingAction(null);
      }
    },
    [id, runAll]
  );

  const confirmAction = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function loadData(isSilent = false) {
      try {
        const statsRes = await getPmtaStats();
        const found = statsRes.find((s: any) => (s.server?.name || s.server) === id);
        setServer(found);

        const historyRes = await fetch(`/api/pmta/history?server=${id}`);
        const json = await historyRes.json();
        const sorted = json.sort(
          (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const formatted = sorted
          .map((item: any, i: number) => {
            if (i === 0) return null;
            return {
              time: new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              outbound: Math.max(
                0,
                (item.traffic?.total?.outbound_msgs || 0) -
                  (sorted[i - 1].traffic?.total?.outbound_msgs || 0)
              ),
              inbound: Math.max(
                0,
                (item.traffic?.total?.inbound_msgs || 0) -
                  (sorted[i - 1].traffic?.total?.inbound_msgs || 0)
              ),
            };
          })
          .filter(Boolean);
        setHistory(formatted);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);
        if (!isSilent) toast.error("Failed to load server data");
      } finally {
        if (!isSilent) setIsLoading(false);
      }
    }

    loadData();
    interval = setInterval(() => loadData(true), 5000);
    return () => clearInterval(interval);
  }, [id]);

  const domainGroups = useMemo(() => {
    if (!server?.queues) return [];
    const grouped = Object.values(
      server.queues.reduce((acc: Record<string, DomainGroup>, q: any) => {
        const domain = (q.queue || "").split("/")[0] || "unknown";
        if (!acc[domain]) {
          acc[domain] = { domain, total: 0, items: [] };
        }
        acc[domain].total += q.rcpt || 0;
        acc[domain].items.push(q);
        return acc;
      }, {})
    ) as DomainGroup[];
    return grouped.sort((a, b) => b.total - a.total);
  }, [server]);

  const selectedGroup = domainGroups.find((d) => d.domain === selectedDomain);
  const totalQueueRcpt = useMemo(
    () => server?.queues?.reduce((sum: number, q: any) => sum + (q.rcpt || 0), 0) || 0,
    [server]
  );

  if (isLoading) return <ServerDetailSkeleton />;
  if (!server) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Server not found</p>
        </Card>
      </div>
    );
  }

  const statusVariant = server.status === "running" ? "default" : "destructive";
  const StatusIcon = server.status === "running" ? CheckCircle2 : XCircle;

  return (
    <TooltipProvider>
      <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                {server.server?.name || server.server}
              </h1>
              <Badge variant={statusVariant} className="gap-1.5">
                <StatusIcon className="h-3.5 w-3.5" />
                {server.status || "unknown"}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Uptime: {server.uptime || "—"}</span>
            </div>
          </div>
        </div>

        {/* Server Actions Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Server Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 mr-4">
                <input
                  type="checkbox"
                  id="runAll"
                  checked={runAll}
                  onChange={(e) => setRunAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="runAll" className="text-sm">
                  Run on all servers
                </label>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => runCommand("reload")}
                    disabled={!!pendingAction}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Reload
                  </button>
                </TooltipTrigger>
                <TooltipContent>Reload PMTA configuration</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      confirmAction(
                        "Restart Server",
                        "Are you sure you want to restart the PMTA service? This may temporarily interrupt mail flow.",
                        () => runCommand("restart")
                      )
                    }
                    disabled={!!pendingAction}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <Power className="h-3.5 w-3.5" />
                    Restart
                  </button>
                </TooltipTrigger>
                <TooltipContent>Restart PMTA service</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => runCommand("reset_counters")}
                    disabled={!!pendingAction}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Reset Counters
                  </button>
                </TooltipTrigger>
                <TooltipContent>Reset traffic counters</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => runCommand("status")}
                    disabled={!!pendingAction}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Status
                  </button>
                </TooltipTrigger>
                <TooltipContent>Check PMTA status</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => runCommand("pause_queue", "*/*")}
                    disabled={!!pendingAction}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Pause All
                  </button>
                </TooltipTrigger>
                <TooltipContent>Pause all queues</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => runCommand("resume_queue", "*/*")}
                    disabled={!!pendingAction}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Resume All
                  </button>
                </TooltipTrigger>
                <TooltipContent>Resume all queues</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() =>
                      confirmAction(
                        "Delete All Queues",
                        "This will delete ALL queues. This action cannot be undone. Are you absolutely sure?",
                        () => runCommand("delete_queue", "*/*")
                      )
                    }
                    disabled={!!pendingAction}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-red-700 text-white hover:bg-red-800 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete All
                  </button>
                </TooltipTrigger>
                <TooltipContent>Delete all queues (dangerous)</TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* Graph Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Throughput (last hour)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PmtaGraph data={history} />
          </CardContent>
        </Card>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Traffic Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm">
                <TrafficTable traffic={server.traffic} />
              </div>
            </CardContent>
          </Card>

          {/* Queue Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                Queue Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {!selectedDomain ? (
                  <div className="space-y-3">
                    {domainGroups.map((d) => (
                      <div
                        key={d.domain}
                        className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div
                          onClick={() => setSelectedDomain(d.domain)}
                          className="flex justify-between items-center cursor-pointer"
                        >
                          <span className="font-mono font-medium">{d.domain}</span>
                          <Badge variant="secondary">{d.total.toLocaleString()} rcpt</Badge>
                        </div>
                        <div className="flex gap-2 mt-2 justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => runCommand("pause_queue", `${d.domain}/*`)}
                                className="text-xs px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                              >
                                Pause Domain
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Pause all queues for {d.domain}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => runCommand("resume_queue", `${d.domain}/*`)}
                                className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Resume Domain
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Resume all queues for {d.domain}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  confirmAction(
                                    `Delete all queues for ${d.domain}`,
                                    `This will delete all queues for domain ${d.domain}. This action cannot be undone.`,
                                    () => runCommand("delete_queue", `${d.domain}/*`)
                                  )
                                }
                                className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete Domain
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Delete all queues for {d.domain}</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  selectedGroup && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => setSelectedDomain(null)}
                          className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                        >
                          ← Back to domains
                        </button>
                        <Badge variant="outline">{selectedGroup.total.toLocaleString()} total rcpt</Badge>
                      </div>
                      <div className="space-y-2">
                        {selectedGroup.items.map((q, idx) => (
                          <div key={idx} className="border rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-mono text-sm font-medium">
                                  {q.queue.split("/")[1] || "-"}
                                </span>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {q.rcpt.toLocaleString()} recipients
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 rounded hover:bg-muted">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => runCommand("pause_queue", q.queue)}>
                                    <Pause className="mr-2 h-4 w-4" /> Pause Queue
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => runCommand("resume_queue", q.queue)}>
                                    <Play className="mr-2 h-4 w-4" /> Resume Queue
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      confirmAction(
                                        "Delete Queue",
                                        `Delete queue ${q.queue}? This action cannot be undone.`,
                                        () => runCommand("delete_queue", q.queue)
                                      )
                                    }
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Queue
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => runCommand("enable_source", q.queue)}>
                                    <RefreshCw className="mr-2 h-4 w-4" /> Enable Source
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {q.error?.message && (
                              <div className="text-xs text-red-400 bg-red-950/30 p-2 rounded">
                                {q.error.message.slice(0, 120)}
                                {q.error.message.length > 120 && "…"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard title="Domains" value={server.domains?.length || 0} icon={<Hash className="h-4 w-4" />} />
          <StatCard title="Queues" value={server.queues?.length || 0} icon={<Server className="h-4 w-4" />} />
          <StatCard
            title="Total Rcpt"
            value={totalQueueRcpt}
            icon={<Activity className="h-4 w-4" />}
            variant="destructive"
          />
          {cmdResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Last Command Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className={`text-xs p-3 rounded overflow-auto ${
                  cmdResult?.status === "success"
                    ? "bg-green-900 text-green-300"
                    : "bg-red-900 text-red-300"
                }`}>
                  {JSON.stringify(cmdResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Confirmation Dialog */}
        <AlertDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog((prev) => ({ ...prev, open: false }));
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  variant = "default",
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: "default" | "success" | "destructive";
}) {
  const variantClasses = {
    default: "text-foreground",
    success: "text-green-600",
    destructive: "text-red-600",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        <p className={`text-2xl font-semibold mt-2 ${variantClasses[variant]}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton (improved)
function ServerDetailSkeleton() {
  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}