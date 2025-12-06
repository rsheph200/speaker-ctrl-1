"use client";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-sm text-neutral-300">We couldn&apos;t load this view. Please go back.</p>
      </div>
    </div>
  );
}
