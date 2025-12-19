const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { createTask, getTask, getAllTasks } = require("./db");
const { addTaskToQueue } = require("./queue");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Endpoint to trigger image generation
app.post("/generate", (req, res) => {
  const { prompt, model, guidance_scale, width, height, num_inference_steps } =
    req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const id = uuidv4();

  // 1. Save to DB
  createTask(id, prompt);

  // 2. Add to Queue
  addTaskToQueue(id, {
    prompt,
    model: model || "qwen-image",
    guidance_scale: guidance_scale || 7.5,
    width: width || 1024,
    height: height || 1024,
    num_inference_steps: num_inference_steps || 20,
  });

  // 3. Return immediate response
  res.status(202).json({
    id,
    status: "pending",
    message: "Task queued successfully",
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

  // 1. Save to DB
  createTask(id, prompt);

  // 2. Add to Queue
  addTaskToQueue(id, {
    prompt,
    images,
    width: width || 1024,
    height: height || 1024,
    num_inference_steps: num_inference_steps || 40,
    true_cfg_scale: true_cfg_scale || 4,
    negative_prompt: negative_prompt || "",
    type: "edit",
  });

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

  // 1. Save to DB
  createTask(id, prompt);

  // 2. Add to Queue
  addTaskToQueue(id, {
    prompt,
    image,
    negative_prompt: negative_prompt || "",
    fps: fps || 16,
    resolution: resolution || "480p",
    frames: frames || 81,
    type: "video",
  });

  // 3. Return immediate response
  res.status(202).json({
    id,
    status: "pending",
    message: "Video generation task queued successfully",
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
