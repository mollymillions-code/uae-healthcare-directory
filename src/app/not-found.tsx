import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-tc py-20 text-center">
      <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
      <h2 className="text-2xl font-bold text-dark mb-4">Page Not Found</h2>
      <p className="text-muted mb-8 max-w-md mx-auto">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link href="/" className="btn-accent">Directory Home</Link>
        <Link href="/search" className="btn-dark">Search Providers</Link>
      </div>
    </div>
  );
}
