const { default: PQueue } = require("p-queue");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { updateTaskStatus } = require("./db");
require("dotenv").config();

const queue = new PQueue({ concurrency: 10 }); // Adjust concurrency as needed
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
  const extension = options.type === "video" ? "mp4" : "png";
  const outputPath = path.join(__dirname, "outputs", `${id}.${extension}`);

  try {
    updateTaskStatus(id, "processing");

    let apiUrl = "https://image.chutes.ai/generate";
    let requestData = { ...options };

    if (options.type === "edit") {
      apiUrl = "https://chutes-qwen-image-edit-2509.chutes.ai/generate";
      const imageB64s = options.images.map((imageName) => {
        const imagePath = path.join(__dirname, "inputs", imageName);
        if (!fs.existsSync(imagePath)) {
          throw new Error(`Input image not found: ${imageName}`);
        }
        const imageBuffer = fs.readFileSync(imagePath);
        return imageBuffer.toString("base64");
      });

      requestData = {
        prompt: options.prompt,
        image_b64s: imageB64s,
        width: options.width,
        height: options.height,
        num_inference_steps: options.num_inference_steps,
        true_cfg_scale: options.true_cfg_scale,
        negative_prompt: options.negative_prompt,
        seed: options.seed || null,
      };
    } else if (options.type === "video") {
      apiUrl = "https://chutes-wan-2-2-i2v-14b-fast.chutes.ai/generate";
      const imagePath = path.join(__dirname, "inputs", options.image);
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Input image not found: ${options.image}`);
      }
      const imageBuffer = fs.readFileSync(imagePath);
      const imageB64 = imageBuffer.toString("base64");

      requestData = {
        prompt: options.prompt,
        image: imageB64,
        negative_prompt: options.negative_prompt || "",
        fps: options.fps,
        resolution: options.resolution,
        frames: options.frames,
      };
    }

    const response = await axios({
      method: "post",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${process.env.CHUTES_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: requestData,
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
    let errorMessage = error.message;
    if (error.response) {
      errorMessage = `API Error: ${error.response.status}`;
      // If it's a stream, we can't easily stringify it without consuming it
      if (error.response.data && typeof error.response.data === "object") {
        if (error.response.data.pipe) {
          errorMessage += " - [Response Stream]";
        } else {
          try {
            errorMessage += ` - ${JSON.stringify(error.response.data)}`;
          } catch (e) {
            errorMessage += " - [Circular/Complex Object]";
          }
        }
      }
    }
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
