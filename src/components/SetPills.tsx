import Link from "next/link";

interface SetPillsProps {
  baseUrl: string;
  totalSets: number;
  currentSet: number;
}

export default function SetPills({ baseUrl, totalSets, currentSet }: SetPillsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6">
      {Array.from({ length: totalSets }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={`${baseUrl}/set-${n}`}
          className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            n === currentSet
              ? "bg-accent text-white shadow-md shadow-blue-200"
              : "bg-white text-slate-600 border border-slate-200 hover:border-accent hover:text-accent"
          }`}
        >
          Set {n}
        </Link>
      ))}
    </div>
  );
}
