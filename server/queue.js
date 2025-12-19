const { default: PQueue } = require("p-queue");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { updateTaskStatus } = require("./db");
require("dotenv").config();

const queue = new PQueue({ concurrency: 2 }); // Adjust concurrency as needed

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
        resolve();
      });
      writer.on("error", (err) => {
        updateTaskStatus(id, "failed", null, err.message);
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
    console.error(`Task ${id} failed:`, errorMessage);
  }
}

function addTaskToQueue(id, options) {
  queue.add(() => processTask({ id, options }));
}

module.exports = {
  addTaskToQueue,
};
