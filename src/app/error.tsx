"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900">Something went wrong!</h2>
        <p className="mb-8 text-gray-600">
          An error occurred while loading this page.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
