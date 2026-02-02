// API base URL - using proxy in development
const API_BASE = "/api";

export interface GenerateImageRequest {
  prompt: string;
  model?: string;
  guidance_scale?: number;
  width?: number;
  height?: number;
  num_inference_steps?: number;
}

export interface GenerateResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  message: string;
}

export interface EditImageRequest {
  prompt: string;
  images: string[];
  width?: number;
  height?: number;
  num_inference_steps?: number;
  true_cfg_scale?: number;
  negative_prompt?: string;
}

export interface TaskStatus {
  id: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  options?: string; // JSON string
  file_path?: string;
  error?: string;
  created_at: number;
  updated_at: number;
}

export async function generateImage(
  request: GenerateImageRequest,
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...request,
      model: request.model || "qwen-image",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate image: ${response.statusText}`);
  }

  return response.json();
}

export async function generateZImage(
  request: GenerateImageRequest,
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/generate-zimage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate Z-Image: ${response.statusText}`);
  }

  return response.json();
}

export async function uploadImage(
  base64Image: string,
): Promise<{ filename: string }> {
  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }

  return response.json();
}

export async function editImage(
  request: EditImageRequest,
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/edit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to edit image: ${response.statusText}`);
  }

  return response.json();
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const response = await fetch(`${API_BASE}/status/${taskId}`);

  if (!response.ok) {
    throw new Error(`Failed to get task status: ${response.statusText}`);
  }

  return response.json();
}

export function getImageUrl(taskId: string, type?: string): string {
  const ext =
    type === "video"
      ? "mp4"
      : type === "analyze-image"
        ? "txt"
        : type === "speak"
          ? "wav"
          : "png";
  return `${API_BASE}/outputs/${taskId}.${ext}`;
}

export function getInputImageUrl(filename: string): string {
  if (filename.startsWith("http") || filename.startsWith("data:"))
    return filename;
  return `${API_BASE}/inputs/${filename}`;
}

export async function getAllTasks(status?: string): Promise<TaskStatus[]> {
  const url = status
    ? `${API_BASE}/status?status=${status}`
    : `${API_BASE}/status`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get tasks: ${response.statusText}`);
  }

  return response.json();
}

export interface CleanupResponse {
  message: string;
  cleanedCount: number;
  cleanedIds: string[];
}

export async function cleanupTasks(
  timeoutMinutes?: number,
): Promise<CleanupResponse> {
  const response = await fetch(`${API_BASE}/cleanup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeoutMinutes: timeoutMinutes || 10,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to cleanup tasks: ${response.statusText}`);
  }

  return response.json();
}
