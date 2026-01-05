import { Suspense } from "react";
import AdminResetClient from "@/components/admin/AdminResetClient";

export default function AdminResetPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black px-6 py-16 text-white">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Admin Reset
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Loading...</h1>
          </div>
        </main>
      }
    >
      <AdminResetClient />
    </Suspense>
  );
}
