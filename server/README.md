# Image Generation Proxy Server

This is a Node.js proxy server for the Chutes AI image generation API. It uses a queuing system to handle requests asynchronously and saves the generated images to the local file system.

## Features

- **Asynchronous Processing**: Immediate response with a task ID.
- **Queue Management**: Uses `p-queue` to manage concurrent requests.
- **Persistence**: Uses SQLite to track task status and metadata.
- **Streaming**: Streams image data directly to the file system to minimize memory usage.

## Prerequisites

- Node.js (v18 or higher recommended)
- A Chutes AI API Token

## Setup

1. **Install Dependencies**:

    ```bash
    npm install
    ```

2. **Configure Environment**:
    Create a `.env` file in the `server` directory:

    ```env
    CHUTES_API_TOKEN=your_api_token_here
    PORT=3000
    ```

## Running the Server

```bash
npm run start
```

The server will be running at `http://localhost:3000`.

## API Endpoints

### 1. Queue Image Generation

**Endpoint**: `POST /generate`

**Request Body**:

```json
{
  "prompt": "A detailed infographic of a coffee machine",
  "model": "qwen-image",
  "guidance_scale": 7.5,
  "width": 1024,
  "height": 1024,
  "num_inference_steps": 20
}
```

*Only `prompt` is required.*

**Response**:

```json
{
  "id": "uuid-v4-string",
  "status": "pending",
  "message": "Task queued successfully"
}
```

### 2. Check Task Status

**Endpoint**: `GET /status/:id`

**Response**:

```json
{
  "id": "uuid-v4-string",
  "prompt": "...",
  "status": "completed",
  "file_path": "/path/to/server/outputs/uuid.png",
  "error": null,
  "created_at": "2023-12-19 12:00:00",
  "updated_at": "2023-12-19 12:00:05"
}
```

## Bruno API Client

A Bruno API collection is provided in the `bruno/` directory at the root of the project. You can use [Bruno](https://www.usebruno.com/) to test the API endpoints easily.

1. Open Bruno.
2. Click "Open Collection" and select the `bruno/` folder.
3. Select the `Local` environment from the environment dropdown in the top right.

## Testing with cURL

### Queue a task

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A futuristic coffee machine"}'
```

### Check status

Replace `<ID>` with the ID returned from the previous command.

```bash
curl http://localhost:3000/status/<ID>
```

## Directory Structure

- `server.js`: Express server and API endpoints.
- `db.js`: SQLite database configuration and helpers.
- `queue.js`: Task queue and worker logic.
- `outputs/`: Directory where generated images are saved.
