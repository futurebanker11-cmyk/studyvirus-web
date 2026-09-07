import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n/lang";

// PLACEHOLDER — Task 4 replaces this with the real home page. It exists so the
// [lang] segment has something to render while the route skeleton is verified.
export default async function Placeholder({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold">StudyVirus</h1>
    </div>
  );
}
