import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Image Generation
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Powered by Qwen Image
              </p>
            </div>
            <nav className="flex gap-4">
              <Link
                to="/"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                activeProps={{ className: "text-blue-800 font-semibold" }}
              >
                Generate Image
              </Link>
              <Link
                to="/tasks"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                activeProps={{ className: "text-blue-800 font-semibold" }}
              >
                Tasks
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  ),
});
