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
        <div className="flex flex-wrap justify-center gap-6 py-6 border-t border-white/10 mb-6 text-sm">
          <span>📝 200,000+ Questions</span>
          <span>📚 35+ Topics</span>
          <span>👨‍🎓 10 Lakh+ Students</span>
          <span>⭐ 4.5 Rating</span>
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
