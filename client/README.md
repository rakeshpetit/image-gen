# Image Generation Frontend

A React frontend built with TanStack Router and TanStack Query for generating images using the Qwen Image model.

## Features

- Simple text input for image generation prompts
- Real-time status polling for task progress
- Display generated images with download option
- Clean, responsive UI built with Tailwind CSS

## Prerequisites

- Node.js 18+ installed
- The backend server running on `http://localhost:3000`

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## How It Works

1. **Home Page (`/`)**: Enter a text prompt describing the image you want to generate
2. **Task Page (`/task/:taskId`)**: Shows the task status with automatic polling:
   - **Pending**: Task is in the queue
   - **Processing**: Image is being generated
   - **Completed**: Image is ready to view and download
   - **Failed**: An error occurred during generation

## API Integration

The frontend communicates with the backend server via the following endpoints:

- `POST /generate` - Queue a new image generation task
- `GET /status/:id` - Check task status
- `GET /outputs/:id.png` - Retrieve generated image

## Tech Stack

- **React 18** - UI library
- **TanStack Router** - File-based routing
- **TanStack Query** - Data fetching and caching
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Project Structure

```
client/
├── src/
│   ├── lib/
│   │   └── api.ts          # API client functions
│   ├── routes/
│   │   ├── __root.tsx      # Root layout
│   │   ├── index.tsx       # Home page
│   │   └── task.$taskId.tsx # Task status page
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── index.html
├── vite.config.ts
└── package.json
