/* oxlint-disable next/no-img-element */
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  ShieldCheck,
  Ticket,
} from 'lucide-react';

import { ticketPlans } from '@/lib/tickets';

export const metadata: Metadata = {
  title: 'Ticket Terms & Conditions | 2026 PMGO SA Fall',
  description:
    'Ticket terms, pass validity, entry rules, and refund conditions for 2026 PMGO SA Fall South Asia Finals in Nepal.',
};

const assets = {
  arenaWide: '/kv-bg-wide.jpg',
  esportsCounty: '/esports-county-black.png',
  pmgoLogo: '/pmgo-finals-logo-white.png',
  pubgLogo: '/pubg-mobile-esports-white.png',
};

const quickFacts = [
  {
    icon: CalendarDays,
    label: 'Event Dates',
    value: '16-19 September 2026',
  },
  {
    icon: MapPin,
    label: 'Venue',
    value: 'Dashrath Rangasala Covered Hall, Nepal',
  },
  {
    icon: Clock3,
    label: 'Doors',
    value: 'TBD',
  },
];

const termSections = [
  {
    title: 'Pass Validity',
    items: [
      'General Day Pass is valid for one selected event day only.',
      'VIP Day Pass is valid for one selected event day and includes VIP access card benefits as issued by the organizer.',
      'Seasonal Pass is valid for all four grand finals days from 16-19 September 2026.',
      'Each attendee must hold a valid pass for the day they attend.',
    ],
  },
  {
    title: 'Payment Confirmation',
    items: [
      'Online ticket payments are processed through Khalti checkout.',
      'A ticket is confirmed only after successful payment verification.',
      'Attendees should keep their payment confirmation and transaction reference available for entry support.',
      'Incorrect, duplicate, cancelled, or unverified transactions may not be accepted at entry.',
    ],
  },
  {
    title: 'Refund Policy',
    items: [
      'All ticket purchases are final and non-refundable.',
      'Unused passes, missed event days, late arrival, or failure to attend do not qualify for a refund.',
      'Lost, damaged, shared, copied, or transferred passes may be refused if they cannot be verified.',
    ],
  },
  {
    title: 'Entry & Venue Rules',
    items: [
      'Door opening time is TBD and entry is subject to venue checks.',
      'Capacity by ticket zone is TBA and may be managed by the organizer for safety and operations.',
      'Attendees must follow venue security checks, organizer instructions, and event staff directions.',
      'The organizer may deny entry for unsafe behavior, invalid passes, or non-compliance with event rules.',
    ],
  },
  {
    title: 'Event Changes',
    items: [
      'Match order, broadcast schedule, sponsors, partners, and operational details are subject to update.',
      'The event team may adjust entry flow, seating, access zones, or show timing if required for production or safety.',
      'Any major public update will be shared through the official event website or organizer communication.',
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050a16] text-white">
      <img
        src={assets.arenaWide}
        alt=""
        className="fixed inset-0 h-full w-full object-cover object-center opacity-18"
        aria-hidden="true"
      />
      <div className="fixed inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.96)_0%,rgba(3,7,18,0.78)_48%,rgba(3,7,18,0.96)_100%),linear-gradient(0deg,rgba(3,7,18,0.96)_0%,rgba(3,7,18,0.46)_52%,rgba(3,7,18,0.84)_100%)]" />

      <header className="relative z-10 border-b border-white/10 bg-[#050912]/78 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="PMGO SA Fall home"
          >
            <img
              src={assets.pubgLogo}
              alt="PUBG Mobile Esports"
              className="h-9 w-10 object-contain"
            />
            <span className="h-8 w-px bg-white/18" aria-hidden="true" />
            <img
              src={assets.pmgoLogo}
              alt="PUBG Mobile Global Open South Asia Finals"
              className="hidden h-9 w-auto max-w-[142px] object-contain sm:block"
            />
            <span className="block truncate text-sm font-black uppercase tracking-[0.12em] sm:hidden">
              PMGO SA
            </span>
          </Link>

          <Link
            href="/#tickets"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-black uppercase tracking-[0.05em] text-[#071123] transition hover:bg-cyan-100"
          >
            <Ticket className="size-4" aria-hidden="true" />
            Tickets
          </Link>
        </nav>
      </header>

      <section className="relative z-10 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">
              Ticketing
            </p>
            <h1 className="mt-4 text-5xl font-black uppercase leading-none sm:text-7xl">
              Terms & Conditions
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              These terms apply to PMGO SA Fall 2026 South Asia Finals tickets
              for the grand finals at Dashrath Rangasala Covered Hall, Nepal.
            </p>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {quickFacts.map((fact) => {
              const Icon = fact.icon;
              return (
                <article
                  key={fact.label}
                  className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-md"
                >
                  <Icon className="size-6 text-red-300" aria-hidden="true" />
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-cyan-100/58">
                    {fact.label}
                  </p>
                  <p className="mt-2 text-xl font-black uppercase leading-tight">
                    {fact.value}
                  </p>
                </article>
              );
            })}
          </div>

          <section className="mt-10 overflow-hidden rounded-lg border border-white/10 bg-[#050915]/78 shadow-[0_30px_120px_rgba(7,13,31,0.45)] backdrop-blur-2xl">
            <div className="border-b border-white/10 p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  className="size-6 text-cyan-200"
                  aria-hidden="true"
                />
                <h2 className="text-3xl font-black uppercase leading-none">
                  Pass Information
                </h2>
              </div>
            </div>

            <div className="grid gap-px bg-white/10 md:grid-cols-3">
              {ticketPlans.map((ticket) => (
                <article key={ticket.id} className="bg-[#071123] p-5 sm:p-6">
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-cyan-100/58">
                    {ticket.subline}
                  </p>
                  <h3 className="mt-3 text-2xl font-black uppercase leading-tight">
                    {ticket.name}
                  </h3>
                  <p className="mt-4 text-4xl font-black text-white">
                    {ticket.price}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {termSections.map((section) => (
              <article
                key={section.title}
                className="rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-md sm:p-6"
              >
                <h2 className="text-2xl font-black uppercase leading-tight">
                  {section.title}
                </h2>
                <ul className="mt-5 grid gap-3">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm font-semibold leading-6 text-slate-300 sm:text-base"
                    >
                      <CheckCircle2
                        className="mt-1 size-4 shrink-0 text-cyan-200"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <section className="mt-8 grid gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-5 backdrop-blur-md sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-black uppercase leading-tight">
                Support
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-300">
                For ticket support, payment confirmation, or event access
                questions, contact the PMGO SA Fall event team.
              </p>
            </div>
            <a
              href="mailto:abhiv@esportscounty.com"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-red-500 px-5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-red-400"
            >
              <Mail className="size-4" aria-hidden="true" />
              Contact
            </a>
          </section>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-[#030712] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <img
            src={assets.esportsCounty}
            alt="Production credits: Krafton, Level Infinite, Lightspeed Studios, and Esports County"
            className="w-full max-w-[620px] object-contain"
          />
          <Link
            href="/#tickets"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-cyan-200/28 bg-white/[0.06] px-5 text-sm font-black uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-cyan-100 hover:text-[#071123]"
          >
            <Ticket className="size-4" aria-hidden="true" />
            Back to Tickets
          </Link>
        </div>
      </footer>
    </main>
  );
}
