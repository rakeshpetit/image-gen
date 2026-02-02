import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadImage, editImage } from "../lib/api";

export const Route = createFileRoute("/edit")({
  component: EditComponent,
});

function EditComponent() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [steps, setSteps] = useState(40);
  const [cfgScale, setCfgScale] = useState(4);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editMutation = useMutation({
    mutationFn: async (vars: {
      prompt: string;
      negativePrompt: string;
      width: number;
      height: number;
      steps: number;
      cfgScale: number;
      imageFiles: File[];
    }) => {
      // 1. Upload images first
      const filenames = await Promise.all(
        vars.imageFiles.map(async (file) => {
          const base64 = await fileToBase64(file);
          const response = await uploadImage(base64);
          return response.filename;
        }),
      );

      // 2. Trigger edit task
      return editImage({
        prompt: vars.prompt,
        images: filenames,
        width: vars.width,
        height: vars.height,
        num_inference_steps: vars.steps,
        true_cfg_scale: vars.cfgScale,
        negative_prompt: vars.negativePrompt,
      });
    },
    onSuccess: (response) => {
      navigate({ to: "/task/$taskId", params: { taskId: response.id } });
    },
    onError: (error) => {
      console.error("Edit failed:", error);
      alert("Failed to edit image. Please try again.");
    },
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + newFiles.length > 2) {
        alert("You can only upload up to 2 images.");
        return;
      }

      const newImages = newFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }
    if (images.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    editMutation.mutate({
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim(),
      width,
      height,
      steps,
      cfgScale,
      imageFiles: images.map((i) => i.file),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Image</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Images (Max 2)
            </label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.preview}
                    alt={`Input ${index + 1}`}
                    className="w-full h-48 object-cover rounded-md border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              {images.length < 2 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Add Image</span>
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Prompt (Describe the changes)
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how to edit the image(s)..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none mb-4"
              disabled={editMutation.isPending}
            />

            <label
              htmlFor="negativePrompt"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Negative Prompt
            </label>
            <textarea
              id="negativePrompt"
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="What to exclude from the image..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none mb-4"
              disabled={editMutation.isPending}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width
                </label>
                <select
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={editMutation.isPending}
                >
                  <option value={512}>512</option>
                  <option value={768}>768</option>
                  <option value={1024}>1024</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height
                </label>
                <select
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={editMutation.isPending}
                >
                  <option value={512}>512</option>
                  <option value={768}>768</option>
                  <option value={1024}>1024</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inference Steps ({steps})
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  className="w-full"
                  disabled={editMutation.isPending}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CFG Scale ({cfgScale})
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={cfgScale}
                  onChange={(e) => setCfgScale(Number(e.target.value))}
                  className="w-full"
                  disabled={editMutation.isPending}
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={
              editMutation.isPending || !prompt.trim() || images.length === 0
            }
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {editMutation.isPending ? "Starting Edit..." : "Edit Image"}
          </button>
        </form>
      </div>

      {editMutation.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          Failed to edit image. Please try again.
        </div>
      )}
    </div>
  );
}
