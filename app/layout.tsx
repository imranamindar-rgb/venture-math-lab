import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Venture Math Lab",
  description: "Monte Carlo simulation for founder, employee, and investor venture financing risk.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
