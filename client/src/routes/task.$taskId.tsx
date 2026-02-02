import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getTaskStatus, getImageUrl, getInputImageUrl } from "../lib/api";

export const Route = createFileRoute("/task/$taskId")({
  component: TaskComponent,
});

function TaskComponent() {
  const { taskId } = Route.useParams();

  // Poll for task status every 2 seconds
  const {
    data: task,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskStatus(taskId),
    refetchInterval: (query) => {
      // Stop polling when task is completed or failed
      const data = query.state.data;
      if (data && (data.status === "completed" || data.status === "failed")) {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  if (isLoading && !task) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        Failed to load task status. Please try again.
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
        Task not found.
      </div>
    );
  }

  const options = task.options ? JSON.parse(task.options) : null;
  const taskType = options?.type || "generate";
  const resultUrl = getImageUrl(task.id, taskType);

  return (
    <div className="space-y-6">
      {/* Show input images if this was an edit or video task */}
      {options && (options.images || options.image) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Input Image(s)
          </h3>
          <div className="flex flex-wrap gap-4">
            {options.images
              ? options.images.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={getInputImageUrl(img)}
                    alt={`Input ${i + 1}`}
                    className="h-32 w-auto rounded border border-gray-200"
                  />
                ))
              : options.image && (
                  <img
                    src={getInputImageUrl(options.image)}
                    alt="Input"
                    className="h-32 w-auto rounded border border-gray-200"
                  />
                )}
          </div>
        </div>
      )}

      {/* Result Section */}
      {task.status === "completed" && task.file_path && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Result</h3>
            <StatusBadge status={task.status} />
          </div>
          <div className="flex justify-center bg-gray-50 rounded-lg p-4">
            {taskType === "video" ? (
              <video
                src={resultUrl}
                controls
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            ) : taskType === "speak" ? (
              <audio src={resultUrl} controls className="w-full" />
            ) : taskType === "analyze-image" ? (
              <div className="bg-white p-4 rounded border border-gray-200 w-full whitespace-pre-wrap text-sm">
                <iframe src={resultUrl} className="w-full h-64 border-none" />
              </div>
            ) : (
              <img
                src={resultUrl}
                alt={task.prompt}
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            )}
          </div>
          <div className="mt-4 text-center">
            <a
              href={resultUrl}
              download={`${taskType}-${task.id}`}
              className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Download {taskType.charAt(0).toUpperCase() + taskType.slice(1)}
            </a>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Task Details
        </h2>

        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-500">Task ID:</span>
            <p className="text-sm text-gray-900 font-mono">{task.id}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">Prompt:</span>
            <p className="text-sm text-gray-900">{task.prompt}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">Status:</span>
            <StatusBadge status={task.status} />
          </div>
        </div>
      </div>

      {task.status === "pending" && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-6 rounded-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="font-medium">Your image is in the queue...</p>
          <p className="text-sm mt-1">
            Please wait while we process your request.
          </p>
        </div>
      )}

      {task.status === "processing" && (
        <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-6 rounded-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="font-medium">Generating your image...</p>
          <p className="text-sm mt-1">This may take a minute or two.</p>
        </div>
      )}

      {task.status === "failed" && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-md">
          <p className="font-medium">Image generation failed</p>
          {task.error && <p className="text-sm mt-2">{task.error}</p>}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
