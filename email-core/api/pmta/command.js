import { runCommand } from "../../services/commandService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      action,
      target = "",
      source_ip = "",
      serverId = null,
      runAll = false
    } = req.body;

    /* ================= VALIDATION ================= */

    if (!action) {
      return res.status(400).json({
        success: false,
        error: "action is required"
      });
    }

    const queueActions = [
      "pause_queue",
      "resume_queue",
      "delete_queue",
      "enable_source"
    ];

    const serverActions = [
      "reload",
      "restart",
      "reset_counters",
      "status"
    ];

    // invalid action
    if (![...queueActions, ...serverActions].includes(action)) {
      return res.status(400).json({
        success: false,
        error: "invalid action"
      });
    }

    // queue action validation
    if (queueActions.includes(action)) {
      if (!target) {
        return res.status(400).json({
          success: false,
          error: "target is required for queue actions"
        });
      }

      // enable_source requires IP
      if (action === "enable_source" && !source_ip) {
        return res.status(400).json({
          success: false,
          error: "source_ip required for enable_source"
        });
      }
    }

    // server selection validation
    if (!runAll && !serverId) {
      return res.status(400).json({
        success: false,
        error: "serverId or runAll=true required"
      });
    }

    /* ================= EXECUTE ================= */

    const results = await runCommand({
      action,
      target,
      source_ip,
      serverId: runAll ? null : serverId
    });

    /* ================= FORMAT RESPONSE ================= */

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return res.status(200).json({
      success: true,
      action,
      totalServers: results.length,
      successCount,
      failCount,
      results
    });

  } catch (err) {
    console.error("PMTA COMMAND API ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "internal server error"
    });
  }
}