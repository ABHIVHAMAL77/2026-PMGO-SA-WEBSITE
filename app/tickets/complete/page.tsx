/* oxlint-disable next/no-img-element */
import Link from 'next/link';

import { KhaltiReturnStatus } from '@/components/khalti-return-status';

const assets = {
  arenaWide: '/kv-bg-wide.webp',
  pmgoLogo: '/pmgo-finals-logo-white.png',
  pubgLogo: '/pubg-mobile-esports-white.png',
};

export default function TicketCompletePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050a16] px-4 py-10 text-white sm:px-6 lg:px-8">
      <img
        src={assets.arenaWide}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center opacity-28"
        aria-hidden="true"
        loading="eager"
        decoding="async"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.9)_0%,rgba(3,7,18,0.66)_48%,rgba(3,7,18,0.9)_100%),linear-gradient(0deg,rgba(3,7,18,0.95)_0%,rgba(3,7,18,0.35)_52%,rgba(3,7,18,0.78)_100%)]" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          aria-label="PMGO SA Fall home"
        >
          <img
            src={assets.pubgLogo}
            alt="PUBG Mobile Esports"
            className="h-10 w-11 object-contain"
          />
          <span className="h-8 w-px bg-white/18" aria-hidden="true" />
          <img
            src={assets.pmgoLogo}
            alt="PUBG Mobile Global Open South Asia Finals"
            className="h-10 w-auto max-w-[150px] object-contain"
          />
        </Link>
      </header>

      <section className="relative z-10 grid min-h-[calc(100svh-112px)] place-items-center py-12">
        <KhaltiReturnStatus />
      </section>
    </main>
  );
}
