/**
 * @fileoverview CampaignTable Component
 *
 * MODIFIED: Bulk Selection and Deletion Support
 * ─────────────────────────────────────────────────────────────────────────────
 * This component has been updated to support multi-campaign selection and
 * bulk deletion directly from the Campaign Manager table UI.
 *
 * New State:
 *   - selectedCampaignIds: Set<string>
 *       Tracks which campaign IDs are currently checked/selected.
 *
 * New UI Elements:
 *   - Checkbox column (48px, non-resizable) prepended to the table.
 *   - Master checkbox in the column header → selects/deselects all on the page.
 *   - Per-row checkbox in each campaign row.
 *   - Floating bulk-actions bar (visible when selectedCampaignIds.size > 0):
 *       · Shows count of selected campaigns.
 *       · "Cancel" button  → clears the selection.
 *       · "Delete Selected" button → visible only with `campaign.delete` permission.
 *
 * New Behaviour:
 *   - Selection auto-resets on any campaigns list change (pagination, filter, search).
 *   - handleBulkDelete() sends selected IDs to DELETE /api/campaigns/delete,
 *     prompts for user confirmation, then refreshes the campaign list.
 *   - All existing single-row delete actions are fully preserved and unaffected.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "./StatusBadge";
  import CampaignControls from "./CampaignControls";
  import Link from "next/link";
  import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";
  import { EyeIcon } from "@heroicons/react/24/outline";
  import { useAuth } from "@/lib/authContext";
  import { PencilSquareIcon } from "@heroicons/react/24/outline";
  import { DocumentDuplicateIcon } from "@heroicons/react/24/outline";
  import { TrashIcon } from "@heroicons/react/24/outline";
  type Pagination = {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };

  type Filters = {
    search: string;
    status: string;
    from: string;
    to: string;
  };

  type Sort = {
    sortBy: string;
    order: "asc" | "desc";
  };

  export default function CampaignTable({
    campaigns,
    pagination,
    filters,
    searchInput,
    setSearchInput,
    onFilterChange,
    onPageChange,
    refresh,
    sort,
    setSort,
    onQuickView,
  }: {
    campaigns: any[];
    pagination: Pagination;
    filters: Filters;
    searchInput: string;
    setSearchInput: (value: string) => void;
    onFilterChange: (filters: Filters) => void;
    onPageChange: (page: number) => void;
    refresh: () => void;
    sort: Sort;
    setSort: (value: Sort) => void;
    onQuickView: (campaign: any) => void;
  }) {
    const router = useRouter();
    // ─── Bulk Selection State ─────────────────────────────────────────────────────
    // Tracks the IDs of all campaigns currently selected via checkboxes.
    // Using a Set for O(1) add/delete/has operations and clean React state updates.
    // ─────────────────────────────────────────────────────────────────────────────
    const [selectedCampaignIds, setSelectedCampaignIds] = useState<Set<string>>(new Set());

    // ─── Auto-Reset Selection on List Change ─────────────────────────────────────
    // Whenever the campaigns list changes (new page, applied filter, search query),
    // clear all selections immediately. This prevents stale IDs — selected on a
    // previous page or filter state — from being accidentally included in a
    // bulk delete that the user did not intend.
    // ─────────────────────────────────────────────────────────────────────────────
    useEffect(() => {
      setSelectedCampaignIds(new Set());
    }, [campaigns]);

    const handleSort = (uiKey: string) => {
    const actualField = sortFieldMap[uiKey] || uiKey;

    setSort({
      sortBy: actualField,
      order:
        sort.sortBy === actualField && sort.order === "asc"
          ? "desc"
          : "asc",
    });
  };
    const { user, hasPermission } = useAuth();

const handleCopy = async (campaignId: string) => {
  const res = await fetch("/api/campaigns/copy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ campaignId }),
  });

  const data = await res.json();

  localStorage.setItem("copyCampaignData", JSON.stringify(data.data));

  // Replaced window.location.href with router.push to avoid a full
  // browser reload and preserve the Campaign Manager layout state.
  router.push("/campaigns/create");
};
const handleDelete = async (campaignId: string) => {
  if (!confirm("Delete this campaign?")) return;

  try {
    await fetch("/api/campaigns/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ campaignId }),
    });

    refresh();

  } catch (err) {
    console.error(err);
  }
};

    // ─── handleBulkDelete ─────────────────────────────────────────────────────────
    // Orchestrates the full bulk deletion flow:
    //   1. Show a confirmation dialog so the user explicitly confirms the action.
    //   2. POST the array of selectedCampaignIds to DELETE /api/campaigns/delete.
    //   3. On success  → clear selection and trigger a campaign list refresh.
    //   4. On failure  → surface the API error message to the user (e.g., if any
    //      of the selected campaigns have status RUNNING, the API returns HTTP 400
    //      with the names of the blocking campaigns — display that message as-is).
    // ─────────────────────────────────────────────────────────────────────────────
    const handleBulkDelete = async () => {
      if (selectedCampaignIds.size === 0) return;

      const selectedCampaigns = campaigns.filter((c) => selectedCampaignIds.has(c._id));
      const runningCampaigns = selectedCampaigns.filter((c) => c.status === "RUNNING");

      if (runningCampaigns.length > 0) {
        alert(
          `Cannot delete selected campaigns because some are currently running:\n${runningCampaigns
            .map((c) => c.campaignName)
            .join("\n")}`
        );
        return;
      }

      if (!confirm(`Are you sure you want to delete the ${selectedCampaignIds.size} selected campaign(s)?`)) {
        return;
      }

      try {
        const res = await fetch("/api/campaigns/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ campaignId: Array.from(selectedCampaignIds) }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || "Failed to delete campaigns");
        }

        setSelectedCampaignIds(new Set());
        refresh();
      } catch (err: any) {
        console.error(err);
        alert(`Delete failed: ${err.message}`);
      }
    };
    const sortFieldMap: Record<string, string> = {
    createdByUserId: "createdByUserId",
    senderServerId: "senderServerId",
    campaignName: "campaignName",
    status: "status",

    sent: "execution.totalSent",
    delivered: "execution.delivered",
    bounce: "execution.hardBounce",       // ✅ FIXED

    opens: "openRate",
    ctr: "ctr",
    clicks: "clickRate",
    optouts: "optouts",
    unsubs: "unsubs",
    complaints: "complaints",
    createdAt: "createdAt",
  };

    const SortArrow = ({ uiKey }: { uiKey: string }) => {
    const actualField = sortFieldMap[uiKey];

    if (sort.sortBy !== actualField) return null;

    return (
      <span className="text-xs">
        {sort.order === "asc" ? "↑" : "↓"}
      </span>
    );
  };
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    createdByUserId: 80,
    senderServerId: 80,
    campaignName: 250,
    status: 100,
    sent: 80,
    delivered: 80,
    opens: 100,
    ctr: 80,
    clicks: 100,
    optouts: 60,
    unsubs: 60,
    bounce: 100,
    complaints: 80,
    createdAt: 160,
    
  });

  const startResize = (
    e: React.MouseEvent,
    columnKey: string
  ) => {
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = columnWidths[columnKey];
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);

      if (newWidth > 60) {
        setColumnWidths((prev) => ({
          ...prev,
          [columnKey]: newWidth,
        }));
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
    return (
      <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl overflow-hidden shadow-soft">

    {/* FILTER BAR */}
    <div className="flex flex-col md:flex-row gap-4 p-5 border-b border-border/60 bg-muted/40 backdrop-blur-sm">

      {/* SEARCH */}
      <div className="flex-1 min-w-[240px]">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="
              w-full pl-9 pr-4 py-2.5
              bg-background border border-border/60
              rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/40
              focus:border-primary/40
              transition
            "
          />
        </div>
      </div>

      {/* STATUS FILTER */}
      <div className="w-full md:w-48">
        <div className="relative">
          <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <select
            value={filters.status}
            onChange={(e) =>
              onFilterChange({ ...filters, status: e.target.value })
            }
            className="
              w-full pl-9 pr-4 py-2.5
              bg-background border border-border/60
              rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-primary/40
              focus:border-primary/40
              transition
            "
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="RUNNING">Running</option>
            <option value="PAUSED">Paused</option>
            <option value="STOPPED">Stopped</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="TESTED">Tested</option>
            <option value="CREATED">Created</option>
          </select>
        </div>
      </div>

      <button
        onClick={refresh}
        className="
          px-5 py-2.5
          bg-primary hover:opacity-90
          text-white text-sm font-medium
          rounded-xl transition
        "
      >
        Apply
      </button>
    </div>

      {/* ─── Bulk Actions Bar ─────────────────────────────────────────────────────────
      // Rendered only when at least one campaign is selected (selectedCampaignIds.size > 0).
      // Displays:
      //   · Count of currently selected campaigns.
      //   · "Cancel" → clears selection without any destructive action.
      //   · "Delete Selected" → shown only if the user has `campaign.delete` permission.
      //     Triggers handleBulkDelete() on click.
      // ───────────────────────────────────────────────────────────────────────────── */}
      {selectedCampaignIds.size > 0 && (
        <div className="flex items-center justify-between px-6 py-4 bg-rose/10 border-b border-rose/20 text-rose animate-fadeIn duration-200">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <TrashIcon className="w-5 h-5 text-rose" />
            <span>{selectedCampaignIds.size} campaign(s) selected</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCampaignIds(new Set())}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-border/60 bg-card hover:bg-hover text-text-primary transition cursor-pointer"
            >
              Cancel
            </button>
            {hasPermission("campaign.delete") && (
              <button
                onClick={handleBulkDelete}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-rose text-white hover:opacity-90 transition cursor-pointer shadow-md"
              >
                Delete Selected
              </button>
            )}
          </div>
        </div>
      )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-fixed border-collapse">
            <thead className="sticky top-0 z-10 bg-background/90 backdrop-blur-md text-[11px] uppercase tracking-wider border-b border-border/60 text-muted-foreground">
              <tr>
                {hasPermission("campaign.delete") && (
                  // ─── Master Checkbox (Select All / Deselect All) ──────────────────────────────
                  // Checked state:
                  //   - Checked      → all campaigns on the current page are selected.
                  //   - Indeterminate → some (but not all) campaigns on the page are selected.
                  //   - Unchecked    → no campaigns are selected.
                  // Clicking toggles between selecting all current-page campaigns and clearing all.
                  // ─────────────────────────────────────────────────────────────────────────────
                  <th className="px-4 py-3 w-12 text-center select-none">
                    <input
                      type="checkbox"
                      checked={
                        campaigns.length > 0 &&
                        campaigns.every((c) => selectedCampaignIds.has(c._id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const newSelected = new Set(selectedCampaignIds);
                          campaigns.forEach((c) => newSelected.add(c._id));
                          setSelectedCampaignIds(newSelected);
                        } else {
                          const newSelected = new Set(selectedCampaignIds);
                          campaigns.forEach((c) => newSelected.delete(c._id));
                          setSelectedCampaignIds(newSelected);
                        }
                      }}
                      className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/40 cursor-pointer"
                    />
                  </th>
                )}
                {[
    { key: "createdByUserId", label: "User ID", align: "left" },
    { key: "createdAt", label: "Created", align: "right" },
    { key: "senderServerId", label: "Sender Server", align: "left" },
    { key: "campaignName", label: "Campaign", align: "left" },
    { key: "status", label: "Status", align: "left" },
    { key: "sent", label: "Sent", align: "right" },
    { key: "delivered", label: "Delivered", align: "right" },
    { key: "opens", label: "Opens", align: "right" },
    { key: "ctr", label: "CTR", align: "right" },
    { key: "clicks", label: "Clicks", align: "right" },
    { key: "optouts", label: "Optouts", align: "right" },
    { key: "unsubs", label: "Unsubs", align: "right" },
    { key: "bounce", label: "Bounce", align: "right" },
    { key: "complaints", label: "Complaints", align: "right" },
  ].map((col) => (
    <th
      key={col.key}
      style={{ width: columnWidths[col.key] }}
      className={`relative px-4 py-3 font-semibold text-muted-foreground/90 select-none ${
  col.align === "right" ? "text-right" : "text-left"
}`}
    >
      <div
        onClick={() => handleSort(col.key)}
        className="flex items-center gap-1 cursor-pointer"
      >
        {col.label}
        <SortArrow uiKey={col.key} />
      </div>

      <div
        onMouseDown={(e) => startResize(e, col.key)}
        className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-primary/40"
      />
    </th>
  ))}

    <th className="px-4 py-3 text-right w-32">Actions</th>
  </tr></thead>
            <tbody className="divide-y divide-border/60">{campaigns.length === 0 && (
                <tr>
                  <td colSpan={16} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-sm font-semibold text-foreground">
                        No campaigns found
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Adjust filters or create a new campaign.
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {campaigns.map((campaign) => (
                <tr
                  key={campaign._id}
                  className="
                    group
                    hover:bg-muted/40
                    transition-colors
                    duration-150
                  "
                >
                  {hasPermission("campaign.delete") && (
                    // ─── Row Checkbox (Individual Campaign Selection) ─────────────────────────────
                    // Toggles this specific campaign's ID in the selectedCampaignIds Set.
                    // Propagation is stopped so the row click handler is not triggered simultaneously.
                    // ─────────────────────────────────────────────────────────────────────────────
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedCampaignIds.has(campaign._id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedCampaignIds);
                          if (e.target.checked) {
                            newSelected.add(campaign._id);
                          } else {
                            newSelected.delete(campaign._id);
                          }
                          setSelectedCampaignIds(newSelected);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/40 cursor-pointer"
                      />
                    </td>
                  )}

                  {/* USER ID */}
    <td
      style={{ width: columnWidths.createdByUserId }}
      className="px-4 py-3 whitespace-nowrap"
    >
      <span className="inline-flex items-center px-2 py-1 rounded-md bg-panel text-xs font-medium text-text-secondary">
        {user?.userId || "—"}
      </span>
    </td>
    {/* CREATED */}
    <td
      style={{ width: columnWidths.createdAt }}
      className="px-4 py-3 text-right text-xs whitespace-nowrap"
    >
      {new Date(campaign.createdAt).toLocaleString("en-IN")}
    </td>

    {/* SENDER SERVER */}
    <td
      style={{ width: columnWidths.senderServerId }}
      className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap"
    >
      {campaign.senderServerId || "—"}
    </td>

    {/* CAMPAIGN */}
    <td
      style={{ width: columnWidths.campaignName,wordBreak: "break-word"  }}
      className="px-4 py-3 font-medium text-foreground break-words"
    >
      <Link
  href={`/campaigns/${encodeURIComponent(campaign.campaignName)}`}
  className="text-foreground font-semibold hover:text-primary hover:underline transition"
>
  {campaign.campaignName}
</Link>
    </td>

    {/* STATUS */}
    <td
      style={{ width: columnWidths.status }}
      className="px-4 py-3"
    >
      <StatusBadge status={campaign.status} />
    </td>

    {/* SENT */}
    <td
      style={{ width: columnWidths.sent }}
      className="px-4 py-3 text-right"
    >
      {campaign.execution?.totalSent?.toLocaleString() ?? 0}
    </td>

    {/* DELIVERED */}
    <td
      style={{ width: columnWidths.delivered }}
      className="px-4 py-3 text-right"
    >
      {campaign.execution?.delivered?.toLocaleString() ?? 0}
    </td>

    {/* OPENS */}
    <td
    style={{ width: columnWidths.opens }}
    className="px-4 py-3 text-right"
  >
    <div className="font-semibold text-fg">
      {campaign.kpi?.uniqueOpens?.toLocaleString() ?? 0}
    </div>

    <div className="text-xs text-muted-foreground mt-1">
      {campaign.kpi?.totalOpens?.toLocaleString() ?? 0} · {campaign.kpi?.openRate ?? 0}%
    </div>

    {campaign.kpi?.botRate > 5 && (
      <div className="text-[11px] text-rose mt-1">
        {campaign.kpi?.botRate}% bots
      </div>
    )}
  </td>

    {/* CTR */}
    <td
      style={{ width: columnWidths.ctr }}
      className="px-4 py-3 text-right font-medium text-emerald"
    >
      {campaign.kpi?.ctr ?? 0}%
    </td>

    {/* CLICKS */}
    <td
      style={{ width: columnWidths.clicks }}
      className="px-4 py-3 text-right"
    >
      <div className="font-medium">
        {campaign.kpi?.uniqueClicks?.toLocaleString() ?? 0}
      </div>
      <div className="text-xs text-muted-foreground">
        {campaign.kpi?.totalClicks?.toLocaleString() ?? 0} · {campaign.kpi?.clickRate ?? 0}%
      </div>
    </td>

    {/* OPTOUTS */}
    <td
      style={{ width: columnWidths.optouts }}
      className="px-4 py-3 text-right font-medium text-amber"
    >
      {campaign.kpi?.optouts?.toLocaleString() ?? 0}
    </td>

    {/* UNSUBS */}
    <td
      style={{ width: columnWidths.unsubs }}
      className="px-4 py-3 text-right font-medium text-rose"
    >
      {campaign.kpi?.unsubs?.toLocaleString() ?? 0}
    </td>

    <td
  style={{ width: columnWidths.bounce }}
  className="px-4 py-3 text-right"
>
  {(() => {
    const hard = campaign.execution?.hardBounce ?? 0;
    const soft = campaign.execution?.softBounce ?? 0;
    const sent =
  campaign.execution?.totalSent ||
  campaign.execution?.delivered ||
  0;

    const totalBounce = hard + soft;
    const hardRate = sent ? Math.min((hard / sent) * 100, 100) : 0;
    const softRate = sent ? (soft / sent) * 100 : 0;

    return (
      <>
        <div
          className={`font-semibold ${
            hardRate > 2 ? "text-rose" : "text-amber"
          }`}
        >
          {hardRate.toFixed(2)}%
        </div>

        <div className="text-xs text-muted-foreground">
          {totalBounce.toLocaleString()} total · {softRate.toFixed(2)}% soft
        </div>
      </>
    );
  })()}
</td>

<td
  style={{ width: columnWidths.complaints }}
  className="px-4 py-3 text-right font-medium text-rose"
>
  {campaign.kpi?.complaints?.toLocaleString() ?? 0}

  {campaign.kpi?.complaintRate > 0 && (
    <div className="text-xs text-muted-foreground">
      {campaign.kpi?.complaintRate}%
    </div>
  )}
</td>

    

    {/* ACTIONS */}
    <td className="px-4 py-3 text-right w-56">
      <div className="flex flex-wrap items-center justify-end gap-2">

  {/* QUICK VIEW */}
  <button
    onClick={() => onQuickView(campaign)}
    className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
  >
    <EyeIcon className="w-4 h-4 text-primary" />
  </button>

  {/* COPY (REQUIRES CREATE) */}
  {hasPermission("campaign.create") && (
    <button
      onClick={() => handleCopy(campaign._id)}
      className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
      title="Copy Campaign"
    >
      <DocumentDuplicateIcon className="w-4 h-4 text-violet" />
    </button>
  )}

  {/* DELETE */}
  {hasPermission("campaign.delete") && (
    <button
      onClick={() => handleDelete(campaign._id)}
      className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
      title="Delete Campaign"
    >
      <TrashIcon className="w-4 h-4 text-rose" />
    </button>
  )}

  {/* EDIT (ONLY WHEN PAUSED OR DRAFT OR CREATED) */}
  {(campaign.status === "PAUSED" || campaign.status === "DRAFT" || campaign.status === "CREATED") && hasPermission("campaign.edit") && (
    <Link
      href={`/campaigns/create?id=${campaign._id}`}
      className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
      title="Edit Campaign"
    >
      <PencilSquareIcon className="w-4 h-4 text-primary" />
    </Link>
  )}

  {/* CONTROLS (REQUIRES SEND) */}
  {hasPermission("campaign.send") && (
    <CampaignControls campaign={campaign} refresh={refresh} />
  )}

</div>
    </td>

  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination.pages > 1 && (
    <div className="flex items-center justify-between px-5 py-4 bg-muted/40 border-t border-border/60">

      <button
        disabled={pagination.page === 1}
        onClick={() => onPageChange(pagination.page - 1)}
        className="px-4 py-2 bg-background border border-border/60 rounded-xl text-sm hover:bg-muted/40 disabled:opacity-40 transition"
      >
        Previous
      </button>

      <span className="text-sm text-muted-foreground">
        Page {pagination.page} of {pagination.pages}
      </span>

      <button
        disabled={pagination.page === pagination.pages}
        onClick={() => onPageChange(pagination.page + 1)}
        className="px-4 py-2 bg-card border border-border rounded-xl text-sm hover:bg-muted/10 disabled:opacity-40 transition"
      >
        Next
      </button>

    </div>
  )}
      </div>
    );
  }