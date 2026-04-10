import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

const CURRENT_YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Current Affairs ${CURRENT_YEAR} - Daily, Weekly & Monthly GK Updates`,
  description:
    "Stay updated with daily current affairs for competitive exams. GK questions from the latest news, government schemes & events.",
  alternates: { canonical: "https://studyvirus.com/current-affairs" },
};

export default function CurrentAffairsPage() {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  // Daily CA available from April 2026 onwards
  const dailyStartMonth = 3; // April (0-indexed)

  // Generate last 7 days for daily section
  const recentDays: { label: string; date: string }[] = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    if (date.getMonth() >= dailyStartMonth) {
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      recentDays.push({
        label: `${dd} ${months[date.getMonth()]}`,
        date: `${currentYear}_${mm}_${dd}`,
      });
    }
  }

  // Monthly capsules (all available months)
  const availableMonths = months.slice(0, currentMonth + 1).reverse();

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Current Affairs" }]} />
      <h1 className="text-3xl font-black text-primary mb-2">Current Affairs {currentYear}</h1>
      <p className="text-slate-500 mb-8">Daily, weekly & monthly GK updates for exam preparation</p>

      {/* Daily CA (April onwards) */}
      {recentDays.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-1 h-6 rounded-full bg-red-500"></span>
            Daily Current Affairs
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recentDays.map((day) => (
              <Link
                key={day.date}
                href={`/current-affairs/daily/${day.date}`}
                className="bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-md transition card-hover text-center"
              >
                <p className="font-bold text-primary">{day.label}</p>
                <p className="text-xs text-slate-400 mt-1">Daily Quiz</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AdSlot slot="inArticle1" />

      {/* Monthly Capsules */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="w-1 h-6 rounded-full bg-blue-500"></span>
          Monthly Capsule
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {availableMonths.map((month) => {
            const monthIdx = months.indexOf(month);
            const mm = String(monthIdx + 1).padStart(2, "0");
            return (
              <Link
                key={month}
                href={`/current-affairs/monthly/${currentYear}_${mm}`}
                className="bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-md transition card-hover"
              >
                <p className="font-bold text-primary">{month} {currentYear}</p>
                <p className="text-xs text-slate-400 mt-1">Monthly capsule with MCQs</p>
              </Link>
            );
          })}
        </div>
      </section>

      <AdSlot slot="inArticle2" />

      {/* How CA works */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100">
        <h2 className="text-lg font-bold text-primary mb-3">How Current Affairs Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
          <div className="flex gap-3">
            <span className="text-2xl">📰</span>
            <div>
              <p className="font-semibold text-primary">Daily (April+)</p>
              <p>New questions added every day from latest news</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <p className="font-semibold text-primary">Weekly</p>
              <p>Compiled from daily updates for quick revision</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">📖</span>
            <div>
              <p className="font-semibold text-primary">Monthly Capsule</p>
              <p>Complete month&apos;s CA with MCQs for exams</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
