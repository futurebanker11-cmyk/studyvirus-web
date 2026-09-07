import type { ReactNode, ElementType } from "react";

/**
 * The horizontal frame every page sits in.
 *
 * Three widths, because the site has three kinds of page:
 *   - `read`  a single column at the reading measure (~70ch) — explanations,
 *             notes, articles. The width the eye actually wants.
 *   - `page`  the default content width — listings, chapter grids.
 *   - `wide`  full chrome width — the header and footer bars.
 *
 * No JavaScript, no measurement: padding is fixed so nothing reflows once the
 * fonts land.
 */
type Width = "read" | "page" | "wide";

const WIDTH: Record<Width, string> = {
  read: "max-w-measure",
  page: "max-w-5xl",
  wide: "max-w-7xl",
};

export default function Container({
  children,
  width = "page",
  as: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  width?: Width;
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag className={`mx-auto w-full px-4 sm:px-6 ${WIDTH[width]} ${className}`}>
      {children}
    </Tag>
  );
}
