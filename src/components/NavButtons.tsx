import Link from "next/link";

interface NavButtonsProps {
  prev?: { href: string; label: string } | null;
  next?: { href: string; label: string } | null;
}

export default function NavButtons({ prev, next }: NavButtonsProps) {
  return (
    <div className="flex items-stretch gap-2 sm:gap-3 mt-6 sm:mt-8">
      {prev ? (
        <Link
          href={prev.href}
          className="flex-1 flex items-center gap-2 bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
        >
          <svg className="w-5 h-5 text-slate-400 group-hover:text-accent transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Previous</p>
            <p className="font-semibold text-primary group-hover:text-accent transition text-sm truncate">{prev.label}</p>
          </div>
        </Link>
      ) : <div className="flex-1" />}
      {next ? (
        <Link
          href={next.href}
          className="flex-1 flex items-center justify-end gap-2 bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group text-right"
        >
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Next</p>
            <p className="font-semibold text-primary group-hover:text-accent transition text-sm truncate">{next.label}</p>
          </div>
          <svg className="w-5 h-5 text-slate-400 group-hover:text-accent transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : <div className="flex-1" />}
    </div>
  );
}
