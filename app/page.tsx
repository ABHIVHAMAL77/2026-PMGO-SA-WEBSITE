/* oxlint-disable next/no-img-element */
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Ticket,
  Trophy,
  UsersRound,
} from 'lucide-react';

import { FallbackImage } from '@/components/fallback-image';
import { MediaApplicationForm } from '@/components/media-application-form';
import { TicketCheckout } from '@/components/ticket-checkout';
import { ThreeStage } from '@/components/three-stage';
import { ticketPlans } from '@/lib/tickets';

const assets = {
  arenaWide: '/kv-bg-wide.jpg',
  eventLockup: '/event-title-lockup.png',
  fullKv: '/pmgo-sa-fall-kv.jpg',
  kvPlayersWide: '/kv-players-wide.jpg',
  playerLeft: '/player-left.png',
  pmgoLogo: '/pmgo-finals-logo-white.png',
  pubgLogo: '/pubg-mobile-esports-white.png',
  esportsCounty: '/esports-county-black.png',
};

const heroFacts = [
  ['16-19 Sep 2026', 'Grand Finals'],
  ['Dashrath Rangasala Covered Hall', 'Nepal'],
  ['TBD', 'Doors Open'],
  ['USD 40,000', 'Prize Pool'],
];

const eventDetails = [
  {
    icon: CalendarDays,
    label: 'Dates',
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
  {
    icon: UsersRound,
    label: 'Teams',
    value: '16 finalist teams',
  },
];

const mediaRequirements = [
  'Full name',
  'National ID',
  'Gmail and WhatsApp',
  'YouTube, TikTok, Instagram links',
];

type RosterPlayer = {
  name: string;
  photoUrl?: string;
  role: string;
};

type FinalistTeam = {
  name: string;
  players: RosterPlayer[];
  logo?: string;
  tag: string;
};

const driveFile = (id: string) => `https://drive.google.com/file/d/${id}/view`;

const finalistTeams: FinalistTeam[] = [
  {
    name: 'Trained To Kill',
    tag: 'T2K',
    logo: '/team-logos/t2k.png',
    players: [
      {
        name: 'SUBBA',
        photoUrl: driveFile('1qaQMsfoe9bkY-TMa8AmaddWnoholxN_j'),
        role: 'Starter',
      },
      {
        name: 'IGNEOUS',
        photoUrl: driveFile('1ZDK2VbSDB-bTRydEr2Ti_gMP9YewG3zS'),
        role: 'Starter',
      },
      {
        name: 'FEARLESS',
        photoUrl: driveFile('1YGhqsz-ZZOkxqJH3a3vuWHsFJEh2A_Gx'),
        role: 'Starter',
      },
      {
        name: 'KLAW',
        photoUrl: driveFile('1QKTURU-QGoLeAB3HRv8YcGrrDX-K6EX4'),
        role: 'Starter',
      },
      {
        name: 'WRAITH',
        photoUrl: driveFile('1hSfe05KhO7ZVZRIVJgyeUJqauNo3P47-'),
        role: 'Substitute',
      },
      {
        name: 'RULZOG',
        photoUrl: driveFile('1CRiPnmRpnSMfXWl1bsLbMkY-wSepxkB9'),
        role: 'Substitute',
      },
    ],
  },
  {
    name: 'Hidden Leaf Esports',
    tag: 'HLX',
    logo: '/team-logos/hlx.png',
    players: [
      {
        name: 'RIGG',
        photoUrl: driveFile('1-_nZA88rKnElREi0QHtbF_DEZXovYdjg'),
        role: 'Starter',
      },
      {
        name: 'DELTA',
        photoUrl: driveFile('1uSgA75RJD54PmvnMUskkziUsd6L7VGex'),
        role: 'Starter',
      },
      {
        name: 'PRECIOUS',
        photoUrl: driveFile('1r6sVtUmKM00kag0vdHMj5FbqyT01Vvjm'),
        role: 'Starter',
      },
      {
        name: 'SID',
        photoUrl: driveFile('1Ku7Srpcb0_Mq95lwDzmjsyyAobx3MZWb'),
        role: 'Starter',
      },
      {
        name: 'TRIXXSIR',
        photoUrl: driveFile('1PPc8t4UuZUSIzu7i56wk7WCKnAhyEOPm'),
        role: 'Substitute',
      },
      { name: 'Xmpl', role: 'Substitute' },
    ],
  },
  {
    name: 'The Gaming Broskis',
    tag: 'TGB',
    logo: '/team-logos/tgb.png',
    players: [
      { name: 'VENOMZOD', role: 'Starter' },
      { name: 'AJAYA', role: 'Starter' },
      { name: 'GYRO', role: 'Starter' },
      { name: 'SYCLON3', role: 'Starter' },
      { name: 'SANGAMZZZ', role: 'Substitute' },
      { name: 'LIQUID', role: 'Substitute' },
    ],
  },
  {
    name: 'HORAA ESPORTS',
    tag: 'HORAA',
    logo: '/team-logos/horaa.png',
    players: [
      { name: 'JIGGL3', role: 'Starter' },
      { name: 'SKY', role: 'Starter' },
      { name: 'SLEEPYY', role: 'Starter' },
      { name: 'NOFEAR911', role: 'Starter' },
      { name: 'HAITDAMI', role: 'Substitute' },
    ],
  },
  {
    name: '4THRIVES',
    tag: '4T',
    logo: '/team-logos/4thrives.png',
    players: [
      { name: 'FALAK', role: 'Starter' },
      { name: 'IQ', role: 'Starter' },
      { name: 'T24', role: 'Starter' },
      { name: 'HUZAIFA', role: 'Starter' },
      { name: 'NOCKI', role: 'Substitute' },
    ],
  },
  {
    name: 'MAXBELS',
    tag: 'MAX',
    logo: '/team-logos/max.png',
    players: [
      {
        name: 'PIKABOY',
        photoUrl: driveFile('1gHYhs9bnQ-vQ-WzLgZjIbY07MPsM0Pb6'),
        role: 'Starter',
      },
      {
        name: 'INVADER',
        photoUrl: driveFile('1VJC4nCCQxHaLgAhaPAUasaMfqr_GOB-z'),
        role: 'Starter',
      },
      {
        name: 'IM77',
        photoUrl: driveFile('1eJGTqAFyG2IG-bn-IPd7k9dSQ84rA-RU'),
        role: 'Starter',
      },
      {
        name: 'SLACK',
        photoUrl: driveFile('1-0v06Hl9-7lMVfp6Aff6diVNvRqRmNKv'),
        role: 'Starter',
      },
      {
        name: 'KHANN',
        photoUrl: driveFile('1nqIiW7e2eekly7OHZ9bfhUyR2EdNuZT8'),
        role: 'Substitute / Team Manager',
      },
    ],
  },
  {
    name: 'XGENERATION',
    tag: 'XG',
    logo: '/team-logos/xg.png',
    players: [
      { name: 'xgDIVINE', role: 'Starter' },
      { name: 'xgORDER', role: 'Starter' },
      { name: 'xgSUPERNOVA', role: 'Starter' },
      { name: 'xgLORD', role: 'Starter' },
      { name: 'xgZIBYAN', role: 'Substitute' },
      { name: 'xgDRAWLIN', role: 'Substitute' },
    ],
  },
  {
    name: '313 ESPORTS',
    tag: '313',
    logo: '/team-logos/313.png',
    players: [
      { name: '313xTARZANzz', role: 'Starter' },
      { name: '313xGHOOST', role: 'Starter' },
      { name: '313xOUTL4W28', role: 'Starter' },
      { name: '313xMADNI11', role: 'Starter' },
      { name: '313xSAAD', role: 'Substitute' },
    ],
  },
  {
    name: 'LF ESPORTS',
    tag: 'LF',
    logo: '/team-logos/lf.png',
    players: [
      { name: 'VAAZ', role: 'Starter' },
      { name: 'ROSHAAN', role: 'Starter' },
      { name: 'PINKMAN', role: 'Starter' },
      { name: 'FLANKYBOI', role: 'Starter' },
      { name: 'SENIOR', role: 'Substitute' },
    ],
  },
  {
    name: 'TRUE ESPORTS',
    tag: 'TRUE',
    logo: '/team-logos/true.png',
    players: [
      { name: 'TrueSHAKA', role: 'Starter' },
      { name: 'TrueMOHSIN', role: 'Starter' },
      { name: 'TrueM7x', role: 'Starter' },
      { name: 'TrueZAMAN', role: 'Starter' },
      { name: 'JokerSir', role: 'Substitute / Team Manager' },
      { name: 'TrueFAHAD', role: 'Substitute' },
    ],
  },
  {
    name: 'THE MYTHICALS',
    tag: 'MYTH',
    logo: '/team-logos/myth.png',
    players: [
      { name: 'mythNOCTO31', role: 'Starter' },
      { name: 'mythMALI', role: 'Starter' },
      { name: 'mythLOOPSIE', role: 'Starter' },
      { name: 'mythBABA', role: 'Starter' },
      { name: 'mythHADiNoMore', role: 'Substitute / Coach' },
    ],
  },
  {
    name: 'XZOTIC ESPORTS',
    tag: 'XZO',
    logo: '/team-logos/xzo.png',
    players: [
      { name: 'xzoRIDER', role: 'Starter' },
      { name: 'xzoSUKUNAjod', role: 'Starter' },
      { name: 'xzoSHERRY77k', role: 'Starter' },
      { name: 'xzoBRUTAL', role: 'Starter' },
      { name: 'xzoKNOXX', role: 'Substitute' },
    ],
  },
  {
    name: 'MR ESPORTS',
    tag: 'MRes',
    logo: '/team-logos/mres.png',
    players: [
      { name: 'MResNaruto', role: 'Starter' },
      { name: 'MResRxJAX', role: 'Starter' },
      { name: 'MResTEEKZiEZz', role: 'Starter' },
      { name: 'MResXiaoYan', role: 'Starter' },
      { name: 'MResRAFI', role: 'Substitute' },
    ],
  },
  {
    name: 'CMF ESPORTS',
    tag: 'CMF',
    logo: '/team-logos/cmf.png',
    players: [
      { name: 'CMFesCooLBoYzz', role: 'Starter' },
      { name: 'CMFesXOTICZ', role: 'Starter' },
      { name: 'CMFesKokemW', role: 'Starter' },
      { name: 'CMFesKnight', role: 'Starter' },
      { name: 'CMFesTahabi', role: 'Substitute' },
    ],
  },
  {
    name: 'A1 RG ESPORTS',
    tag: 'A1Rg',
    logo: '/team-logos/a1rg.png',
    players: [
      { name: 'A1RgSiNiSTER', role: 'Starter' },
      { name: 'A1RgRowDY', role: 'Starter' },
      { name: 'A1RgDEathstorM', role: 'Starter' },
      { name: 'A1RgCJboyyyy', role: 'Starter' },
      { name: 'A1RgFLASH', role: 'Starter' },
    ],
  },
  {
    name: 'VAVK SILENT ARMY',
    tag: 'SAvavk',
    logo: '/team-logos/vavk.png',
    players: [
      { name: 'SAvavkAceryyyy', role: 'Starter' },
      { name: 'SAvavkSPIDYoP', role: 'Starter' },
      { name: 'SAvavkSKYFALL7', role: 'Starter' },
      { name: 'SAvavkSiCTuX', role: 'Starter' },
      { name: 'SAvavkBiPLOB', role: 'Substitute / Team Manager' },
    ],
  },
];

const rosterStats = [
  ['16', 'Teams'],
  ['80+', 'Players'],
  ['40K', 'USD Prize Pool'],
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050a16] text-white">
      <ThreeStage />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#050912]/78 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href="#top"
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
          </a>

          <div className="hidden items-center gap-5 text-xs font-black uppercase tracking-[0.08em] text-white/72 lg:flex xl:gap-8 xl:text-sm">
            <a href="#tickets" className="transition hover:text-white">
              Tickets
            </a>
            <a href="#details" className="transition hover:text-white">
              Details
            </a>
            <a href="#teams" className="transition hover:text-white">
              Teams
            </a>
            <a href="#schedule" className="transition hover:text-white">
              Schedule
            </a>
            <a href="#media" className="transition hover:text-white">
              Media
            </a>
          </div>

          <a
            href="#tickets"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-black uppercase tracking-[0.05em] text-[#071123] transition hover:bg-cyan-100"
          >
            <Ticket className="size-4" aria-hidden="true" />
            Tickets
          </a>
        </nav>
      </header>

      <section
        id="top"
        className="relative min-h-[100svh] overflow-hidden pt-16"
        data-qa="hero"
      >
        <img
          src={assets.arenaWide}
          alt="PMGO South Asia Finals key visual arena in Nepal with red arches and a central tower."
          className="hero-kv-pan absolute inset-0 h-full w-full object-cover object-center"
          data-qa="hero-kv"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.68)_0%,rgba(3,7,18,0.08)_45%,rgba(3,7,18,0.58)_100%),linear-gradient(0deg,rgba(3,7,18,0.92)_0%,rgba(3,7,18,0.06)_52%,rgba(3,7,18,0.26)_100%)]" />
        <div
          className="hero-light-sweep absolute inset-0 opacity-55"
          aria-hidden="true"
        />
        <img
          src={assets.playerLeft}
          alt=""
          className="runner-motion absolute -bottom-14 -left-44 z-[6] hidden h-[82vh] max-h-[860px] w-auto object-contain opacity-95 drop-shadow-[0_32px_86px_rgba(0,0,0,0.62)] lg:block"
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-6 sm:pb-8 lg:pb-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center">
            <img
              src={assets.eventLockup}
              alt="2026 PMGO S2 South Asia Finals"
              className="w-[min(880px,92vw)] object-contain drop-shadow-[0_18px_58px_rgba(0,0,0,0.58)]"
              data-qa="hero-lockup"
            />
            <div className="mt-4 grid w-full max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-md border border-white/12 bg-white/12 backdrop-blur-xl lg:grid-cols-4">
              {heroFacts.map(([value, label]) => (
                <div
                  key={value}
                  className="min-h-20 bg-[#050912]/72 px-4 py-3 text-center"
                >
                  <p className="text-sm font-black uppercase tracking-[0.08em] text-white">
                    {value}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-100/58">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <h1 className="sr-only">2026 PMGO SA Fall South Asia Finals</h1>
      </section>

      <section
        id="tickets"
        className="relative z-10 bg-[#070d1c] px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-red-300">
                Tickets
              </p>
              <h2 className="mt-3 text-4xl font-black uppercase leading-none sm:text-6xl">
                Choose your pass.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-slate-300">
              Select your pass, add buyer details, and continue through Khalti
              checkout.
            </p>
          </div>

          <TicketCheckout tickets={ticketPlans} />
        </div>
      </section>

      <section
        id="details"
        className="relative z-10 overflow-hidden bg-[#050a16] px-4 py-20 sm:px-6 lg:px-8"
      >
        <img
          src={assets.fullKv}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-18"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,22,0.98)_0%,rgba(5,10,22,0.9)_58%,rgba(5,10,22,0.72)_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">
              Event Details
            </p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none sm:text-6xl">
              Four days. One finals stage.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
              PMGO SA Fall brings 16 South Asia finalists to Nepal for the 2026
              grand finals and a USD 40,000 prize pool.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {eventDetails.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.label}
                  className="depth-panel min-h-36 rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md"
                >
                  <Icon className="size-6 text-red-300" aria-hidden="true" />
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-cyan-100/58">
                    {item.label}
                  </p>
                  <p className="mt-2 text-xl font-black uppercase leading-tight">
                    {item.value}
                  </p>
                </article>
              );
            })}
            <article className="depth-panel min-h-36 rounded-lg border border-white/10 bg-white/[0.06] p-5 backdrop-blur-md sm:col-span-2">
              <Trophy className="size-6 text-red-300" aria-hidden="true" />
              <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-cyan-100/58">
                Sponsors and partners
              </p>
              <p className="mt-2 text-xl font-black uppercase leading-tight">
                TBA
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="teams"
        className="relative z-10 overflow-hidden bg-[#070d1c] px-4 py-20 sm:px-6 lg:px-8"
      >
        <img
          src={assets.kvPlayersWide}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-14"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,13,28,0.98)_0%,rgba(7,13,28,0.91)_48%,rgba(7,13,28,0.84)_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-red-300">
                Finalist Teams
              </p>
              <h2 className="mt-3 text-4xl font-black uppercase leading-none sm:text-6xl">
                16 squads locked in.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
                Team logos lead each card. Player names open photo references
                when available.
              </p>
            </div>

            <div className="grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-md border border-white/12 bg-white/12">
              {rosterStats.map(([value, label]) => (
                <div
                  key={label}
                  className="bg-[#050912]/78 px-4 py-4 text-center"
                >
                  <p className="text-2xl font-black uppercase text-white sm:text-3xl">
                    {value}
                  </p>
                  <p className="mt-1 text-[12px] font-black uppercase tracking-[0.16em] text-cyan-100/58">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            data-qa="teams-grid"
          >
            {finalistTeams.map((team) => {
              const isMaxbels = team.tag === 'MAX';

              return (
                <article
                  key={team.name}
                  className="depth-panel rounded-lg border border-white/10 bg-[#091225]/82 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-5"
                >
                  <FallbackImage
                    src={team.logo}
                    alt={`${team.name} logo`}
                    className={`mx-auto flex w-full items-center justify-center overflow-hidden rounded-md border border-white/12 bg-[radial-gradient(circle_at_50%_42%,rgba(125,211,252,0.16),rgba(5,9,18,0.96)_62%)] p-5 ${
                      isMaxbels ? 'aspect-square max-w-[240px]' : 'aspect-[4/3]'
                    }`}
                    imgClassName={`h-full w-full drop-shadow-[0_18px_36px_rgba(0,0,0,0.45)] ${
                      isMaxbels
                        ? 'scale-125 object-cover object-[50%_58%]'
                        : 'object-contain'
                    }`}
                  >
                    <span className="flex flex-col items-center justify-center text-center leading-none">
                      <span className="text-6xl font-black uppercase tracking-[0.02em] text-white">
                        {team.tag}
                      </span>
                      <span className="mt-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100/62">
                        Esports
                      </span>
                    </span>
                  </FallbackImage>

                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-black uppercase leading-tight text-white">
                        {team.name}
                      </h3>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-100/58">
                        {team.tag}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-md border border-white/10">
                    {team.players.map((player) => {
                      return player.photoUrl ? (
                        <a
                          key={`${team.tag}-${player.name}`}
                          href={player.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block min-h-10 truncate border-b border-white/10 bg-white/[0.045] px-3 py-2 text-sm font-black text-white transition last:border-b-0 hover:bg-cyan-200/10 hover:text-cyan-100"
                          title={`Open ${player.name} player photo`}
                        >
                          {player.name}
                        </a>
                      ) : (
                        <div
                          key={`${team.tag}-${player.name}`}
                          className="min-h-10 truncate border-b border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-black text-white/82 last:border-b-0"
                        >
                          {player.name}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="schedule"
        className="relative z-10 bg-[#070d1c] px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-red-300">
              Schedule
            </p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none sm:text-6xl">
              Finals window.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Four straight days of PMGO South Asia Finals at Dashrath Rangasala
              Covered Hall, Nepal. Door timing will be announced.
            </p>
          </div>

          <article className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] shadow-[0_22px_70px_rgba(0,0,0,0.2)]">
            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
              <div className="relative min-h-64 overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(125,211,252,0.18),rgba(9,18,37,0.92)_58%)] p-6 sm:p-8 lg:border-b-0 lg:border-r">
                <div
                  className="absolute -right-12 -top-12 size-40 rounded-full border border-cyan-100/14"
                  aria-hidden="true"
                />
                <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">
                  16-19 Sep
                </p>
                <p className="mt-5 text-7xl font-black uppercase leading-none text-white sm:text-8xl">
                  4
                </p>
                <p className="mt-2 text-3xl font-black uppercase leading-none text-white">
                  Days
                </p>
                <p className="mt-5 text-sm font-black uppercase tracking-[0.18em] text-white/54">
                  September 2026
                </p>
              </div>

              <div className="grid">
                <div className="grid gap-3 border-b border-white/10 px-5 py-5 sm:grid-cols-[42px_1fr]">
                  <CalendarDays
                    className="size-6 text-red-300"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xl font-black uppercase">Grand Finals</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                      Match order and broadcast details are TBA.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 border-b border-white/10 px-5 py-5 sm:grid-cols-[42px_1fr]">
                  <MapPin className="size-6 text-cyan-200" aria-hidden="true" />
                  <div>
                    <p className="text-xl font-black uppercase">
                      Dashrath Rangasala Covered Hall
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                      Nepal
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 px-5 py-5 sm:grid-cols-[42px_1fr]">
                  <Clock3 className="size-6 text-red-300" aria-hidden="true" />
                  <div>
                    <p className="text-xl font-black uppercase">Doors TBD</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                      Entry timing will be confirmed for all four finals days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        id="media"
        className="relative z-10 overflow-hidden bg-[#050a16] px-4 py-20 sm:px-6 lg:px-8"
      >
        <img
          src={assets.arenaWide}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center opacity-16"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,22,0.98)_0%,rgba(5,10,22,0.88)_54%,rgba(5,10,22,0.76)_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">
              Media Partners
            </p>
            <h2 className="mt-3 text-4xl font-black uppercase leading-none sm:text-6xl">
              Apply for media access.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
              Creators and outlets can submit details for media partner
              consideration.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {mediaRequirements.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/10 bg-white/[0.055] p-4"
                >
                  <CheckCircle2
                    className="size-5 text-red-300"
                    aria-hidden="true"
                  />
                  <p className="mt-4 text-sm font-black uppercase tracking-[0.08em] text-white">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <MediaApplicationForm />
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-[#030712] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] md:items-start">
          <div className="max-w-[720px]">
            <img
              src={assets.esportsCounty}
              alt="Production credits: Krafton, Level Infinite, Lightspeed Studios, and Esports County"
              className="w-full object-contain"
            />
          </div>

          <div className="md:justify-self-end md:self-center">
            <Link
              href="/terms"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-cyan-200/28 bg-white/[0.06] px-5 text-sm font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-100 hover:text-[#071123]"
            >
              <Ticket className="size-4" aria-hidden="true" />
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
