import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: '2026 PMGO SA Fall | Nepal Grand Finals',
  description:
    'Official event site for 2026 PMGO SA Fall in Nepal, featuring grand finals details, ticket zones, venue information, and USD 40,000 prize pool.',
  openGraph: {
    title: '2026 PMGO SA Fall | Nepal Grand Finals',
    description:
      '16 teams. Four grand finals days. USD 40,000 prize pool at Dashrath Rangasala Covered Hall in Nepal.',
    images: ['/kv-players-wide.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '2026 PMGO SA Fall | Nepal Grand Finals',
    description:
      'Tickets opening soon for the 2026 PMGO SA Fall grand finals in Nepal.',
    images: ['/kv-players-wide.webp'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          as="image"
          href="/kv-bg-wide.webp"
          fetchPriority="high"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
