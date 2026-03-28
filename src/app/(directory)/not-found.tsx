import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h1 className="text-6xl font-bold text-[#006828] mb-4">404</h1>
      <h2 className="text-2xl font-bold text-[#1c1c1c] mb-4">Page Not Found</h2>
      <p className="text-black/40 mb-8 max-w-md mx-auto">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link href="/" className="btn-accent">Directory Home</Link>
        <Link href="/search" className="btn-dark">Search Providers</Link>
      </div>
    </div>
  );
}
