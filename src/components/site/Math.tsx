// The KaTeX stylesheet is imported HERE and nowhere else.
//
// It is 24KB of CSS plus a 60-file, 1.2MB font directory. Importing it in the
// root layout put that on every page — including the 26 privacy pages, which
// render no math — which contradicts this site's performance budget on patchy
// 4G. Next.js scopes a component's CSS import to the routes that actually pull
// the component in, so keeping it on the leaf is what keeps the cost off pages
// that do not need it.
//
// Anything rendering `renderInlineMath` output MUST go through this component
// rather than importing the stylesheet again.
import "katex/dist/katex.min.css";

import { renderInlineMath } from "@/lib/ui/format";

/**
 * Renders one run of explanation text that may contain `$…$` / `$$…$$`.
 *
 * `renderInlineMath` runs on the server and returns HTML, so no math
 * JavaScript reaches the phone. The `dangerouslySetInnerHTML` is safe for this
 * input specifically: the source is first-party question-bank content and
 * KaTeX runs with `throwOnError: false`. Never route user-submitted text
 * through it.
 */
export default function Math({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderInlineMath(text) }}
    />
  );
}
