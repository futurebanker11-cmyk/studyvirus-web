import Link from "next/link";

export default function NotFound() {
  const popularLinks = [
    { href: "/topics", label: "All Topics" },
    { href: "/topics/history", label: "Indian History" },
    { href: "/topics/polity", label: "Indian Polity" },
    { href: "/topics/geography", label: "Geography" },
    { href: "/pyq", label: "Previous Year Papers" },
    { href: "/mock-tests", label: "Mock Tests" },
    { href: "/current-affairs", label: "Current Affairs" },
    { href: "/english", label: "English Grammar" },
    { href: "/articles", label: "Study Articles" },
  ];

  return (
    <div className="text-center py-16 max-w-xl mx-auto">
      <h1 className="text-7xl font-black text-primary mb-3">404</h1>
      <p className="text-xl text-slate-500 mb-2">Page not found</p>
      <p className="text-slate-400 mb-8">
        The page you are looking for does not exist or has been moved.
      </p>

      <Link
        href="/"
        className="inline-block bg-accent text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition mb-10"
      >
        Go to Homepage
      </Link>

      <div className="text-left mt-6">
        <h2 className="text-lg font-bold text-primary mb-4">Popular Sections</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {popularLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl px-4 py-3 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition text-sm font-medium text-slate-600 hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
