import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";

// Frontdoor's own brand type. Bricolage (display) + Hanken Grotesk (body):
// warm, characterful, and legible for an older, non-designer audience.
// See docs/design/website.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Frontdoor: your website is your front door",
  description:
    "We build small-business websites your customers actually trust. See your demo before you pay a cent.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${display.variable} ${body.variable} bg-paper text-ink`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      {children}
    </div>
  );
}
