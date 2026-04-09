import Link from "next/link";

interface StudyTabsProps {
  baseUrl: string;
  active: "quiz" | "notes" | "oneliners";
}

export default function StudyTabs({ baseUrl, active }: StudyTabsProps) {
  const tabs = [
    { key: "quiz", label: "Quiz Sets", icon: "✍️", href: baseUrl },
    { key: "notes", label: "Notes", icon: "📝", href: `${baseUrl}/notes` },
    { key: "oneliners", label: "One-Liners", icon: "💡", href: `${baseUrl}/oneliners` },
  ];

  return (
    <div className="sticky top-14 z-20 bg-[#f8fafc]/95 backdrop-blur-md py-2 mb-4 -mx-1 overflow-x-auto scrollbar-none">
      <div className="flex gap-2 min-w-max">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              active === tab.key
                ? "bg-accent text-white shadow-md shadow-blue-200"
                : "bg-white text-slate-600 border border-slate-200 hover:border-accent hover:text-accent"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
