import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-black text-primary mb-4">404</h1>
      <p className="text-xl text-slate-500 mb-8">Page not found</p>
      <Link
        href="/"
        className="bg-accent text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition"
      >
        Go Home
      </Link>
    </div>
  );
}
