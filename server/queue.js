const { default: PQueue } = require("p-queue");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { updateTaskStatus } = require("./db");
require("dotenv").config();

const queue = new PQueue({ concurrency: 2 }); // Adjust concurrency as needed
const QUEUE_FILE = path.join(__dirname, "queue.txt");

// Initialize queue file
if (!fs.existsSync(QUEUE_FILE)) {
  fs.writeFileSync(QUEUE_FILE, "");
}

function addToQueueFile(id) {
  fs.appendFileSync(QUEUE_FILE, `${id}\n`);
}

function removeFromQueueFile(id) {
  try {
    const data = fs.readFileSync(QUEUE_FILE, "utf8");
    const lines = data
      .split("\n")
      .filter((line) => line.trim() !== id && line.trim() !== "");
    fs.writeFileSync(
      QUEUE_FILE,
      lines.join("\n") + (lines.length > 0 ? "\n" : "")
    );
  } catch (err) {
    console.error("Error updating queue file:", err);
  }
}

async function processTask(task) {
  const { id, options } = task;
  const outputPath = path.join(__dirname, "outputs", `${id}.png`);

  try {
    updateTaskStatus(id, "processing");

    const response = await axios({
      method: "post",
      url: "https://image.chutes.ai/generate",
      headers: {
        Authorization: `Bearer ${process.env.CHUTES_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: options,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        updateTaskStatus(id, "completed", outputPath);
        removeFromQueueFile(id);
        resolve();
      });
      writer.on("error", (err) => {
        updateTaskStatus(id, "failed", null, err.message);
        removeFromQueueFile(id);
        reject(err);
      });
    });
  } catch (error) {
    const errorMessage = error.response
      ? `API Error: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      : error.message;
    updateTaskStatus(id, "failed", null, errorMessage);
    removeFromQueueFile(id);
    console.error(`Task ${id} failed:`, errorMessage);
  }
}

function addTaskToQueue(id, options) {
  addToQueueFile(id);
  queue.add(() => processTask({ id, options }));
}

module.exports = {
  addTaskToQueue,
};
