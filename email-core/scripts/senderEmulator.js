import http from "http";

const PORT = 8080;

const server = http.createServer((req, res) => {
  console.log(`\n📥 [Sender Emulator] Received request: ${req.method} ${req.url}`);
  console.log(`🔑 X-Internal-Key: ${req.headers["x-internal-key"]}`);

  let body = "";
  req.on("data", (chunk) => { body += chunk.toString(); });
  req.on("end", () => {
    try {
      const data = JSON.parse(body);
      console.log("📝 Payload received:");
      console.log(`   To: ${data.to}`);
      console.log(`   From: ${data.fromEmail}`);
      console.log(`   Subject: ${data.subject}`);
      console.log(`   VMTA: ${data.vmta}`);
      console.log(`   HTML Length: ${data.html.length} chars`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "sent",
        messageId: `<mock-id-${Date.now()}@localhost>`,
        timestamp: new Date().toISOString()
      }));
      console.log("✅ [Sender Emulator] Sent success response back to Email-Core");
    } catch (err) {
      console.error("❌ [Sender Emulator] Error parsing body:", err.message);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "invalid_json" }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 [Sender Emulator] Running on http://localhost:${PORT}`);
  console.log(`   (Emulating the PHP Sender Server for development)`);
});
