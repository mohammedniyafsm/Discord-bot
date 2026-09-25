import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discord Interactions Bot",
  description: "Phase 1 Discord interactions endpoint",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
