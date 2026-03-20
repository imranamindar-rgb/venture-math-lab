import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Venture Math Lab",
  description: "Deterministic venture finance, Monte Carlo simulation, and cap-table waterfall modeling for startup financing risk.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
