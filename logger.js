// authLogger.js
const fs = require("fs");
const path = require("path");

// Create logs folder if not exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Logger middleware
function authLogger(req, res, next) {
  const authHeader = req.headers["authorization"] || "NO_AUTH_HEADER";

  // Generate filename based on current date (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];
  const logFile = path.join(logsDir, `auth-${today}.txt`);

  // Log entry with timestamp
  const logEntry = `[${new Date().toISOString()}] | Synced By: ${authHeader}\n`;

  // Append entry to daily log file
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) console.error("Error writing log:", err);
  });

  next();
}

module.exports = authLogger;
