/**
 * Main server file - Image Generation Server
 * Refactored with separation of concerns and centralized configuration
 */

const express = require("express");
const path = require("path");
const { server, queue } = require("./config");
const routes = require("./routes");
const { cleanupStuck } = require("./services/cleanupService");
const { removeFromQueueFile } = require("./utils/queueFile");

// Initialize Express app
const app = express();

// Middleware
app.use(express.json({ limit: server.requestLimit }));
app.use(express.urlencoded({ limit: server.requestLimit, extended: true }));

// Static file serving
app.use("/outputs", express.static(path.join(__dirname, "outputs")));
app.use("/inputs", express.static(path.join(__dirname, "inputs")));

// Mount API routes
app.use("/", routes);

// Periodically cleanup stuck tasks
setInterval(
  () => {
    const result = cleanupStuck(queue.timeoutMinutes);
    if (result.cleanedCount > 0) {
      result.cleanedIds.forEach((id) => removeFromQueueFile(id));
      console.log(
        `[Cleanup] Marked ${result.cleanedCount} stuck tasks as failed.`,
      );
    }
  },
  queue.cleanupIntervalMinutes * 60 * 1000,
);

// Start server
app.listen(server.port, server.host, () => {
  console.log(`Server running on http://${server.host}:${server.port}`);
});
