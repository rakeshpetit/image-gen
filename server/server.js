const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {
  createTask,
  getTask,
  getAllTasks,
  cleanupStuckTasks,
  deleteTask,
} = require("./db");
const { addTaskToQueue, removeFromQueueFile } = require("./queue");
require("dotenv").config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/outputs", express.static(path.join(__dirname, "outputs")));
app.use("/inputs", express.static(path.join(__dirname, "inputs")));

// Helper function to save base64 image to inputs directory
function saveBase64Image(base64String) {
  if (!base64String || !base64String.startsWith("data:image")) {
    throw new Error("Invalid base64 image data");
  }

  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const extension = base64String.split(";")[0].split("/")[1] || "png";
  const filename = `input_${uuidv4()}.${extension}`;
  const filepath = path.join(__dirname, "inputs", filename);
  fs.writeFileSync(filepath, buffer);
  return filename;
}

const PORT = process.env.PORT || 3000;

// Endpoint to upload an image
app.post("/upload", (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Image data is required" });
  }

  try {
    const filename = saveBase64Image(image);
    res.json({ filename });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint to trigger image generation
app.post("/generate", (req, res) => {
  const { prompt, model, guidance_scale, width, height, num_inference_steps } =
    req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const id = uuidv4();
  const options = {
    prompt,
    model: model || "qwen-image",
    guidance_scale: guidance_scale || 7.5,
    width: width || 1024,
    height: height || 1024,
    num_inference_steps: num_inference_steps || 20,
    type: "generate",
  };

  // 1. Save to DB
  createTask(id, prompt, options);

  // 2. Add to Queue
  addTaskToQueue(id, options);

  // 3. Return immediate response
  res.status(202).json({
    id,
    status: "pending",
    message: "Task queued successfully",
  });
});

// Endpoint to trigger z-image generation
app.post("/generate-zimage", (req, res) => {
  const { prompt, width, height, num_inference_steps } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const id = uuidv4();
  const optionsObj = {
    prompt,
    width: width || 1024,
    height: height || 1024,
    num_inference_steps: num_inference_steps || 4,
    type: "zimage",
  };

  // 1. Save to DB
  createTask(id, prompt, optionsObj);

  // 2. Add to Queue
  addTaskToQueue(id, optionsObj);

  // 3. Return immediate response
  res.status(202).json({
    id,
    status: "pending",
    message: "Z-Image task queued successfully",
  });
});

// Endpoint to trigger image editing
app.post("/edit", (req, res) => {
  const {
    prompt,
    images,
    width,
    height,
    num_inference_steps,
    true_cfg_scale,
    negative_prompt,
  } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: "At least one image is required" });
  }

  const id = uuidv4();
  const optionsObj = {
    prompt,
    images,
    width: width || 1024,
    height: height || 1024,
    num_inference_steps: num_inference_steps || 40,
    true_cfg_scale: true_cfg_scale || 4,
    negative_prompt: negative_prompt || "",
    type: "edit",
  };

  // 1. Save to DB
  createTask(id, prompt, optionsObj);

  // 2. Add to Queue
  addTaskToQueue(id, optionsObj);

  // 3. Return immediate response
  res.status(202).json({
    id,
    status: "pending",
    message: "Edit task queued successfully",
  });
});

// Endpoint to trigger video generation
app.post("/generate-video", (req, res) => {
  const { prompt, image, negative_prompt, fps, resolution, frames } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  if (!image) {
    return res.status(400).json({ error: "Input image is required" });
  }

  const id = uuidv4();
  const optionsObj = {
    prompt,
    image,
    negative_prompt: negative_prompt || "",
    fps: fps || 16,
    resolution: resolution || "480p",
    frames: frames || 81,
    type: "video",
  };

  // 1. Save to DB
  createTask(id, prompt, optionsObj);

  // 2. Add to Queue
  addTaskToQueue(id, optionsObj);

  // 3. Return immediate response
  res.status(202).json({
    id,
    status: "pending",
    message: "Video generation task queued successfully",
  });
});

// Endpoint to analyze an image using Qwen3-VL
app.post("/analyze-image", (req, res) => {
  const { prompt, image, image_url } = req.body;

  if (!image && !image_url) {
    return res.status(400).json({
      error: "Image (base64 or filename) or image_url is required",
    });
  }

  const id = uuidv4();
  let finalImage = image;

  // If image is base64, save it to inputs/
  if (image && image.startsWith("data:image")) {
    try {
      finalImage = saveBase64Image(image);
    } catch (err) {
      return res.status(400).json({ error: "Invalid base64 image data" });
    }
  }

  const optionsObj = {
    prompt: prompt || "Describe this image",
    image: finalImage,
    image_url: image_url,
    type: "analyze-image",
  };

  // 1. Save to DB
  createTask(id, prompt || "Describe this image", optionsObj);

  // 2. Add to Queue
  addTaskToQueue(id, optionsObj);

  // 3. Return immediate response
  res.status(202).json({
    id,
    status: "pending",
    message: "Analyze image task queued successfully",
  });
});

// Endpoint to trigger text-to-voice generation using Kokoro
app.post("/speak", (req, res) => {
  const { text, voice, speed } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const id = uuidv4();
  const optionsObj = {
    text,
    voice: voice || "af_heart",
    speed: speed || 1.0,
    type: "speak",
  };

  // 1. Save to DB
  createTask(id, text, optionsObj);

  // 2. Add to Queue
  addTaskToQueue(id, optionsObj);

  // 3. Return immediate response
  res.status(202).json({
    id,
    status: "pending",
    message: "Speak task queued successfully",
  });
});

// Endpoint to check status
app.get("/status/:id", (req, res) => {
  const { id } = req.params;
  const task = getTask(id);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json(task);
});

// Endpoint to get all tasks
app.get("/status", (req, res) => {
  const { status } = req.query;
  const tasks = getAllTasks(status);
  res.json(tasks);
});

// Endpoint to delete a task
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const task = getTask(id);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  // 1. Delete from DB
  deleteTask(id);

  // 2. Remove from Queue File
  removeFromQueueFile(id);

  // 3. Delete output file if exists
  if (task.file_path) {
    if (fs.existsSync(task.file_path)) {
      try {
        fs.unlinkSync(task.file_path);
      } catch (err) {
        console.error(`Error deleting file: ${task.file_path}`, err);
      }
    }
  }

  res.json({ message: "Task deleted successfully" });
});

// Endpoint to manually trigger cleanup of stuck tasks
app.post("/cleanup", (req, res) => {
  const { timeoutMinutes } = req.body;
  const cleanedIds = cleanupStuckTasks(timeoutMinutes || 10);
  cleanedIds.forEach((id) => removeFromQueueFile(id));
  res.json({
    message: `Cleanup completed. ${cleanedIds.length} tasks were marked as failed.`,
    cleanedCount: cleanedIds.length,
    cleanedIds,
  });
});

// Periodically cleanup stuck tasks every 5 minutes
setInterval(
  () => {
    const cleanedIds = cleanupStuckTasks(10);
    if (cleanedIds.length > 0) {
      cleanedIds.forEach((id) => removeFromQueueFile(id));
      console.log(
        `[Cleanup] Marked ${cleanedIds.length} stuck tasks as failed.`,
      );
    }
  },
  5 * 60 * 1000,
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
