/**
 * @fileoverview Delete Campaign API Handler
 *
 * MODIFIED: Bulk Campaign Deletion Support
 * ─────────────────────────────────────────────────────────────────────────────
 * This handler now supports both single and bulk campaign deletion via a single
 * endpoint. The `campaignId` field in the request body can be either:
 *   - A string  → deletes a single campaign (backward-compatible)
 *   - An array  → deletes multiple campaigns in one operation
 *
 * Flow:
 *   1. Normalize `campaignId` to an array regardless of input type.
 *   2. Fetch all matching Campaign documents from the database.
 *   3. Validate that NONE of the campaigns have status === 'RUNNING'.
 *      → If any are running, return HTTP 400 with their names listed.
 *   4. Perform a bulk soft-delete via Campaign.updateMany():
 *      → Sets isDeleted = true and deletedAt = new Date() for all matched IDs.
 *
 * Existing Behaviour Preserved:
 *   - Single campaign deletion works exactly as before (string input).
 *   - Running campaign protection is enforced for both single and bulk.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Campaign from "../../models/Campaign.js";

export default async function deleteCampaign(req, res) {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        error: "campaignId_required",
      });
    }

    // ─── Step 1: Normalize Input ─────────────────────────────────────────────────
    // Accept either a single campaign ID (string) or multiple IDs (array).
    // Convert to array so all downstream logic is uniform regardless of input type.
    // ─────────────────────────────────────────────────────────────────────────────
    const ids = Array.isArray(campaignId) ? campaignId : [campaignId];

    if (ids.length === 0) {
      return res.status(400).json({
        error: "campaignId_empty",
      });
    }

    // ─── Step 2: Fetch Campaigns ──────────────────────────────────────────────────
    // Retrieve all Campaign documents matching the provided IDs.
    // This is required before deletion so we can run status validation (Step 3).
    // ─────────────────────────────────────────────────────────────────────────────
    const campaigns = await Campaign.find({ _id: { $in: ids } });

    if (campaigns.length === 0) {
      return res.status(404).json({
        error: "campaigns_not_found",
      });
    }

    // ─── Step 3: Validate — Block Deletion of Running Campaigns ──────────────────
    // A campaign with status RUNNING must never be deleted mid-execution.
    // Filter for any campaigns in the RUNNING state and collect their names.
    // If any are found, return HTTP 400 immediately with a descriptive message
    // that lists each offending campaign name so the user knows what to fix.
    // ─────────────────────────────────────────────────────────────────────────────
    const runningCampaigns = campaigns.filter((c) => c.status === "RUNNING");
    if (runningCampaigns.length > 0) {
      return res.status(400).json({
        error: "cannot_delete_running_campaign",
        message: `Cannot delete campaigns that are currently RUNNING: ${runningCampaigns
          .map((c) => c.campaignName)
          .join(", ")}`,
      });
    }

    // ─── Step 4: Bulk Soft-Delete ─────────────────────────────────────────────────
    // Use updateMany to soft-delete all validated campaigns in a single DB call.
    // Soft-delete fields:
    //   isDeleted  → true   (flags the record as deleted, hides it from queries)
    //   deletedAt  → now    (records the exact timestamp of deletion for auditing)
    // updateMany is used here for atomicity and performance across N campaigns.
    // ─────────────────────────────────────────────────────────────────────────────
    const now = new Date();
    await Campaign.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          isDeleted: true,
          deletedAt: now,
        },
      }
    );

    return res.json({
      status: "deleted",
      count: ids.length,
    });

  } catch (err) {
    console.error("DELETE CAMPAIGN ERROR:", err);

    return res.status(500).json({
      error: "delete_failed",
      message: err.message,
    });
  }
}