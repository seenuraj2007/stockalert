import Link from "next/link";
import { Package } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100">
          <Package className="h-10 w-10 text-indigo-600" />
        </div>
        <h2 className="mb-4 text-4xl font-bold text-gray-900">404</h2>
        <h3 className="mb-4 text-2xl font-semibold text-gray-700">Page Not Found</h3>
        <p className="mb-8 text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
