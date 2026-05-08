import { runCommand } from "../services/commandService.js";

export async function runCommandController(req, res) {
  try {
    const { action, target, source_ip, serverId } = req.body;

    const result = await runCommand({
      action,
      target,
      source_ip,
      serverId
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}