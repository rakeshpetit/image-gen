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

export interface TaskStatus {
  id: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
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

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const response = await fetch(`${API_BASE}/status/${taskId}`);

  if (!response.ok) {
    throw new Error(`Failed to get task status: ${response.statusText}`);
  }

  return response.json();
}

export function getImageUrl(taskId: string): string {
  return `${API_BASE}/outputs/${taskId}.png`;
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
