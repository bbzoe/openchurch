import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-6 py-20">
      <h1 className="text-3xl font-bold tracking-tight">This page is not here</h1>
      <p className="mt-3 text-sm text-body">The church or service may have moved.</p>
      <Link href="/churches" className="mt-6 inline-block text-sm font-semibold text-action">
        Back to churches
      </Link>
    </main>
  );
}
