import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "StyleScan: Furniture Identifier | AI-Powered Furniture Recognition",
  description:
    "Identify furniture styles, eras, and estimated values with AI. StyleScan analyzes design, construction, and materials to give you expert-level insights in seconds.",
  alternates: { canonical: "https://studyvirus.com/apps/stylescan" },
};

export default function StyleScanPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "StyleScan" },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-4">StyleScan: Furniture Identifier</h1>

      <article className="prose prose-slate max-w-none text-slate-700">
        <p className="text-lg">
          Ever spotted a beautiful chair at a thrift store and wondered what style it is? Or inherited an antique desk and wanted to know its real value? StyleScan is the AI furniture identifier and appraisal app that gives you expert-level answers in seconds — free to try, no account needed.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">How It Works</h2>
        <p>
          Simply point your camera at any piece of furniture or home decor. StyleScan&apos;s AI analyzes the design, construction, and materials to identify the style, era, maker, and estimated market value range. One photo is all you need.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">What StyleScan Identifies</h2>
        <p>
          StyleScan works as a universal furniture identifier for chairs, tables, desks, sofas, beds, cabinets, dressers, bookcases, wardrobes, sideboards, buffets, armoires, credenzas, benches, nightstands, vanities, consoles, lighting fixtures, rugs, and more. It works across wood, metal, leather, wicker, upholstered, and mixed-material furniture.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Design Styles Recognized</h2>
        <p>
          StyleScan identifies over 50 furniture styles including Mid-Century Modern, Art Deco, Scandinavian, Victorian, Industrial, Bohemian, Farmhouse, Contemporary, Minimalist, Japandi, Hollywood Regency, Coastal, Bauhaus, Art Nouveau, Colonial, Craftsman, Mission, Shaker, French Provincial, Mediterranean, Rustic, Transitional, and many more.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Detailed Appraisal for Every Scan</h2>
        <p>
          Each furniture scan delivers:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Identified design style and era or decade of origin</li>
          <li>Key characteristics and defining features</li>
          <li>Materials and construction details</li>
          <li>Estimated market value range</li>
          <li>Where to shop for similar pieces at retailers like Chairish, 1stDibs, Etsy Vintage, West Elm, and Wayfair</li>
          <li>Care and maintenance tips for the materials</li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Who Uses StyleScan</h2>
        <p>
          Used by antique collectors, interior designers, thrift shoppers, estate sale hunters, antique dealers, and DIY restorers.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Premium Features</h2>
        <p>
          Free users get 3 furniture scans per day. Upgrade to Premium for:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Unlimited scans</li>
          <li>Detailed value estimates and appraisal reports</li>
          <li>Complete-the-room style matching suggestions</li>
          <li>Ad-free experience</li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Style Library & Quiz</h2>
        <p>
          Browse over 50 design styles with detailed guides covering history, defining characteristics, signature color palettes, famous designers, iconic furniture pieces, and recommended retailers. Not sure what your personal style is? Take the built-in style quiz to discover your unique design profile.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Save & Organize Your Finds</h2>
        <p>
          Build your personal furniture collection. Save every scan, organize pieces into custom boards, add notes, and revisit your identification history anytime. Perfect for tracking finds across multiple estate sales or thrift store visits.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-8">
          <p className="text-sm text-slate-600">
            <strong>Note:</strong> Value estimates are AI-generated guidance based on current market data and are intended for reference purposes only — not professional appraisals.
          </p>
        </div>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Download StyleScan Today</h2>
        <p>
          Whether you are at an estate sale, antique shop, flea market, garage sale, or just curious about that vintage piece in your living room, StyleScan is the antique identifier and furniture appraisal app that gives you expert-level knowledge from a single photo.
        </p>

        <div className="mt-8 p-6 bg-slate-100 rounded-lg">
          <h3 className="font-bold text-primary mb-3">App Information</h3>
          <p className="text-sm mb-2"><strong>Developer:</strong> Manmeet Kumar</p>
          <p className="text-sm mb-4"><strong>Support:</strong> support@gkquestionsguru.com</p>
          <p className="text-sm mb-4">
            <Link href="/apps/stylescan/privacy-policy" className="text-accent hover:underline">
              Read our Privacy Policy
            </Link>
          </p>
        </div>
      </article>
    </div>
  );
}
