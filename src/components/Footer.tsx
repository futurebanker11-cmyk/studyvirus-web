import Link from "next/link";

const EXAM_LINKS = [
  { name: "SSC CGL", href: "/exam/ssc-cgl" },
  { name: "RRB NTPC", href: "/exam/rrb-ntpc" },
  { name: "SSC GD", href: "/exam/ssc-gd" },
  { name: "Delhi Police", href: "/exam/delhi-police" },
  { name: "UP Police", href: "/exam/up-police" },
  { name: "NDA", href: "/exam/nda" },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-slate-900 to-black text-slate-400 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-black text-sm text-white">SV</div>
              <span className="text-white font-black text-lg">StudyVirus</span>
            </div>
            <p className="text-sm leading-relaxed mb-4">India&apos;s largest free GK question bank. 200,000+ questions for all competitive exams.</p>
            <a
              href="https://play.google.com/store/apps/details?id=gk.gkinhindi.currentaffairs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold text-white transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
              </svg>
              Get the App
            </a>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">Popular Exams</h3>
            <ul className="space-y-2 text-sm">
              {EXAM_LINKS.map(e => (
                <li key={e.name}><Link href={e.href} className="hover:text-white transition">{e.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">Topics</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/topics/history" className="hover:text-white transition">Indian History</Link></li>
              <li><Link href="/topics/polity" className="hover:text-white transition">Indian Polity</Link></li>
              <li><Link href="/topics/geography" className="hover:text-white transition">Geography</Link></li>
              <li><Link href="/topics/economics" className="hover:text-white transition">Economics</Link></li>
              <li><Link href="/topics/physics" className="hover:text-white transition">Physics</Link></li>
              <li><Link href="/topics" className="text-accent hover:underline transition">All Topics →</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">Practice</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pyq" className="hover:text-white transition">PYQ Papers</Link></li>
              <li><Link href="/mock-tests" className="hover:text-white transition">Mock Tests</Link></li>
              <li><Link href="/english" className="hover:text-white transition">English Grammar</Link></li>
              <li><Link href="/current-affairs" className="hover:text-white transition">Current Affairs</Link></li>
              <li><Link href="/articles" className="hover:text-white transition">Study Articles</Link></li>
            </ul>
          </div>
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap justify-center gap-6 py-6 border-t border-white/10 mb-6 text-sm text-slate-300">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            200,000+ Questions
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            35+ Topics
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            10 Lakh+ Students
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            4.5 Rating
          </span>
        </div>

        {/* Bottom */}
        <div className="text-center text-xs text-slate-500">
          <nav className="flex flex-wrap justify-center gap-4 mb-3">
            <Link href="/about" className="hover:text-white transition">About</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
            <Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          </nav>
          <p>© {new Date().getFullYear()} StudyVirus. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
