import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllTasks, cleanupTasks } from "../lib/api";

export const Route = createFileRoute("/tasks")({
  component: TasksComponent,
});

function TasksComponent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  // Fetch all tasks with optional status filter
  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tasks", statusFilter],
    queryFn: () =>
      getAllTasks(statusFilter === "all" ? undefined : statusFilter),
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: cleanupTasks,
    onSuccess: (response) => {
      setCleanupMessage(
        `Cleanup completed! ${response.cleanedCount} tasks were marked as failed.`,
      );
      // Invalidate tasks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // Clear message after 5 seconds
      setTimeout(() => setCleanupMessage(null), 5000);
    },
    onError: (error) => {
      setCleanupMessage(`Cleanup failed: ${error.message}`);
      setTimeout(() => setCleanupMessage(null), 5000);
    },
  });

  const handleCleanup = () => {
    if (
      window.confirm(
        "This will mark stuck tasks (inactive for 10+ minutes) as failed. Continue?",
      )
    ) {
      cleanupMutation.mutate(undefined);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncatePrompt = (prompt: string, maxLength: number = 80) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + "...";
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Tasks</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isLoading ? "Loading..." : `${tasks.length} task(s) found`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            {/* Cleanup button */}
            <button
              onClick={handleCleanup}
              disabled={cleanupMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {cleanupMutation.isPending ? "Cleaning..." : "Cleanup"}
            </button>
          </div>
        </div>

        {/* Cleanup message */}
        {cleanupMessage && (
          <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
            {cleanupMessage}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          Failed to load tasks. Please try again.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && tasks.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-12 rounded-md text-center">
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm mt-2">
            {statusFilter === "all"
              ? "Generate an image to get started."
              : `No tasks with status "${statusFilter}".`}
          </p>
        </div>
      )}

      {/* Task list */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() =>
                navigate({ to: "/task/$taskId", params: { taskId: task.id } })
              }
              className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-transparent hover:border-blue-500"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {task.id}
                    </span>
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="text-sm text-gray-900 break-words">
                    {truncatePrompt(task.prompt)}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                    <span>Created: {formatDate(task.created_at)}</span>
                    <span>Updated: {formatDate(task.updated_at)}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
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
