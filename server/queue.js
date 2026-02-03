/**
 * Queue module - handles task processing and queue management
 * Refactored to use centralized configuration and utility modules
 */

const { default: PQueue } = require("p-queue");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { updateTaskStatus } = require("./db");
const { api, queue, paths, taskExtensions, defaults } = require("./config");
const { readImageAsBase64, readImageAsDataUrl } = require("./utils/fileUtils");
const { addToQueueFile, removeFromQueueFile } = require("./utils/queueFile");

const queueInstance = new PQueue({ concurrency: queue.concurrency });

/**
 * Process a task by calling the appropriate API
 * @param {Object} task - Task object containing id and options
 * @returns {Promise<void>}
 */
async function processTask(task) {
  const { id, options } = task;
  const extension = taskExtensions[options.type] || "png";
  const outputPath = path.join(__dirname, paths.outputs, `${id}.${extension}`);

  try {
    updateTaskStatus(id, "processing");

    let apiUrl = api.imageGeneration;
    let requestData = { ...options };

    // Build request data based on task type
    if (options.type === "zimage") {
      apiUrl = api.zImageGeneration;
      requestData = {
        prompt: options.prompt,
        width: options.width,
        height: options.height,
        num_inference_steps: options.num_inference_steps,
      };
    } else if (options.type === "edit") {
      apiUrl = api.imageEdit;
      const imageB64s = options.images.map((imageName) =>
        readImageAsBase64(imageName),
      );

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
      apiUrl = api.videoGeneration;
      const imageB64 = readImageAsBase64(options.image);

      requestData = {
        prompt: options.prompt,
        image: imageB64,
        negative_prompt: options.negative_prompt || "",
        fps: options.fps,
        resolution: options.resolution,
        frames: options.frames,
      };
    } else if (options.type === "analyze-image") {
      apiUrl = api.analyzeImage;
      let imageUrl = options.image_url || options.image;

      // If it's a filename (doesn't start with http or data:), load it from inputs/
      if (
        imageUrl &&
        !imageUrl.startsWith("http") &&
        !imageUrl.startsWith("data:")
      ) {
        imageUrl = readImageAsDataUrl(imageUrl);
      }

      if (!imageUrl) {
        throw new Error("No image source provided for analysis");
      }

      requestData = {
        model: defaults.analyzeImage.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: options.prompt },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: defaults.analyzeImage.max_tokens,
        temperature: defaults.analyzeImage.temperature,
      };
    } else if (options.type === "speak") {
      apiUrl = api.speak;
      requestData = {
        text: options.text,
        voice: options.voice,
        speed: options.speed,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => {
        controller.abort();
      },
      queue.timeoutMinutes * 60 * 1000,
    );

    const isStream = options.type !== "analyze-image";
    const response = await axios({
      method: "post",
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${api.token}`,
        "Content-Type": "application/json",
      },
      data: requestData,
      responseType: isStream ? "stream" : "json",
      signal: controller.signal,
    });

    if (isStream) {
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          clearTimeout(timeoutId);
          updateTaskStatus(id, "completed", outputPath);
          removeFromQueueFile(id);
          resolve();
        });
        writer.on("error", (err) => {
          clearTimeout(timeoutId);
          updateTaskStatus(id, "failed", null, err.message);
          removeFromQueueFile(id);
          reject(err);
        });
      });
    } else {
      clearTimeout(timeoutId);
      const content = response.data.choices[0].message.content;
      fs.writeFileSync(outputPath, content);
      updateTaskStatus(id, "completed", outputPath);
      removeFromQueueFile(id);
    }
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

/**
 * Add a task to the queue
 * @param {string} id - Task ID
 * @param {Object} options - Task options
 */
function addTaskToQueue(id, options) {
  addToQueueFile(id);
  queueInstance.add(() => processTask({ id, options }));
}

module.exports = {
  addTaskToQueue,
  removeFromQueueFile,
};
