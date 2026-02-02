import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateImage } from "../lib/api";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

function IndexComponent() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  // Generate image mutation
  const generateMutation = useMutation({
    mutationFn: generateImage,
    onSuccess: (response) => {
      navigate({ to: "/task/$taskId", params: { taskId: response.id } });
    },
    onError: (error) => {
      console.error("Generation failed:", error);
      alert("Failed to generate image. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }
    generateMutation.mutate({
      prompt: prompt.trim(),
      model: "Qwen-Image-2512",
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Generate Image
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={generateMutation.isPending}
            />
          </div>
          <button
            type="submit"
            disabled={generateMutation.isPending || !prompt.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {generateMutation.isPending ? "Generating..." : "Generate Image"}
          </button>
        </form>
      </div>

      {generateMutation.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          Failed to generate image. Please try again.
        </div>
      )}
    </div>
  );
}
