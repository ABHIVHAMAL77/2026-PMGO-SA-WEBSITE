'use client';

import { ChangeEvent, SyntheticEvent, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Ticket,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { TicketPlan } from '@/lib/tickets';

type BuyerDetails = {
  name: string;
  email: string;
  phone: string;
};

type CheckoutResponse = {
  error?: string;
  paymentUrl?: string;
};

const initialBuyer: BuyerDetails = {
  name: '',
  email: '',
  phone: '',
};

const eventDates = [
  { label: '16 Sep 2026', value: '2026-09-16' },
  { label: '17 Sep 2026', value: '2026-09-17' },
  { label: '18 Sep 2026', value: '2026-09-18' },
  { label: '19 Sep 2026', value: '2026-09-19' },
];

const clampQuantity = (value: number) => Math.min(10, Math.max(1, value));

export function TicketCheckout({ tickets }: { tickets: TicketPlan[] }) {
  const [selectedDate, setSelectedDate] = useState(eventDates[0].value);
  const [quantity, setQuantity] = useState(1);
  const [buyer, setBuyer] = useState<BuyerDetails>(initialBuyer);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTicket = tickets[0];
  const total = selectedTicket ? selectedTicket.amountNpr * quantity : 0;
  const selectedDateLabel = eventDates.find(
    (date) => date.value === selectedDate,
  )?.label;

  const updateBuyer =
    (field: keyof BuyerDetails) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.currentTarget;

      setBuyer((current) => ({
        ...current,
        [field]: value,
      }));
      setError('');
    };

  const handleQuantityInput = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;

    setQuantity(clampQuantity(Number(value) || 1));
    setError('');
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTicket) {
      setError('Please choose a pass first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/khalti/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: buyer,
          eventDate: selectedDate,
          eventDateLabel: selectedDateLabel,
          quantity,
          ticketId: selectedTicket.id,
        }),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as CheckoutResponse;

      if (!response.ok || !payload.paymentUrl) {
        throw new Error(
          payload.error ?? 'Khalti checkout could not start right now.',
        );
      }

      window.location.assign(payload.paymentUrl);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Khalti checkout could not start right now.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mt-10 overflow-hidden rounded-lg border border-white/12 bg-[#050915]/82 shadow-[0_34px_130px_rgba(3,7,18,0.55)] backdrop-blur-2xl xl:grid xl:grid-cols-[minmax(310px,0.72fr)_minmax(0,1fr)]"
      data-qa="ticket-grid"
    >
      <aside className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_24%_0%,rgba(125,249,255,0.24),transparent_34%),linear-gradient(135deg,rgba(13,29,61,0.94),rgba(5,9,21,0.98))] p-5 sm:p-7 xl:border-r xl:border-b-0">
        <div className="absolute -right-20 -top-20 size-56 rounded-full border border-cyan-100/14" />
        <div className="absolute bottom-0 right-0 h-28 w-44 bg-red-500/10 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-md border border-cyan-200/28 bg-cyan-200/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
            <Ticket className="size-4" aria-hidden="true" />
            Official Ticket
          </div>

          <h3 className="mt-7 text-4xl font-black uppercase leading-none text-white sm:text-5xl">
            {selectedTicket?.name}
          </h3>

          <div className="mt-7 rounded-lg border border-white/12 bg-white/[0.07] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100/58">
              Ticket price
            </p>
            <p className="mt-2 text-5xl font-black leading-none text-white">
              NPR 400
            </p>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-cyan-100/62">
              Per selected day
            </p>
          </div>

          <ul className="mt-6 grid gap-3">
            {selectedTicket?.details.map((detail) => (
              <li
                key={detail}
                className="flex items-center gap-3 text-sm font-semibold text-slate-200"
              >
                <CheckCircle2
                  className="size-4 shrink-0 text-cyan-200"
                  aria-hidden="true"
                />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <form
        className="p-5 sm:p-7 lg:p-8"
        onSubmit={handleSubmit}
        data-qa="khalti-ticket-checkout"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">
              Checkout
            </p>
            <h3 className="mt-2 text-3xl font-black uppercase leading-none">
              Khalti Payment
            </h3>
          </div>
          <ShieldCheck className="size-7 text-red-300" aria-hidden="true" />
        </div>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.055] p-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/58">
                Selected pass
              </p>
              <p className="mt-2 text-xl font-black uppercase text-white">
                {selectedTicket?.name}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                {selectedTicket?.subline} · {selectedDateLabel}
              </p>
            </div>
            <div className="rounded-md bg-cyan-200 px-4 py-3 text-right text-[#071123]">
              <p className="text-xs font-black uppercase tracking-[0.12em]">
                Total
              </p>
              <p className="text-2xl font-black">
                NPR {total.toLocaleString('en-US')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <Label
              htmlFor="ticket-name"
              className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70"
            >
              Full name
            </Label>
            <Input
              id="ticket-name"
              name="name"
              value={buyer.name}
              onChange={updateBuyer('name')}
              placeholder="Ticket buyer name"
              autoComplete="name"
              required
              className="mt-2 h-12 rounded-md border-white/14 bg-white/[0.07] px-4 text-white placeholder:text-slate-500 focus-visible:border-cyan-200"
            />
          </div>

          <div>
            <Label
              htmlFor="ticket-email"
              className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70"
            >
              Gmail / email
            </Label>
            <Input
              id="ticket-email"
              name="email"
              type="email"
              value={buyer.email}
              onChange={updateBuyer('email')}
              placeholder="name@gmail.com"
              autoComplete="email"
              required
              className="mt-2 h-12 rounded-md border-white/14 bg-white/[0.07] px-4 text-white placeholder:text-slate-500 focus-visible:border-cyan-200"
            />
          </div>

          <div>
            <Label
              htmlFor="ticket-phone"
              className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70"
            >
              Phone / WhatsApp
            </Label>
            <Input
              id="ticket-phone"
              name="phone"
              type="tel"
              value={buyer.phone}
              onChange={updateBuyer('phone')}
              placeholder="+977 98XXXXXXXX"
              autoComplete="tel"
              required
              className="mt-2 h-12 rounded-md border-white/14 bg-white/[0.07] px-4 text-white placeholder:text-slate-500 focus-visible:border-cyan-200"
            />
          </div>
        </div>

        <div className="mt-5">
          <Label className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70">
            Event date
          </Label>
          <div
            className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
            role="radiogroup"
            aria-label="Choose event date"
          >
            {eventDates.map((date) => (
              <button
                key={date.value}
                type="button"
                role="radio"
                aria-checked={selectedDate === date.value}
                onClick={() => {
                  setSelectedDate(date.value);
                  setError('');
                }}
                className={cn(
                  'min-h-14 rounded-md border px-3 text-sm font-black uppercase tracking-[0.06em] transition',
                  selectedDate === date.value
                    ? 'border-cyan-200 bg-cyan-200 text-[#071123] shadow-[0_16px_40px_rgba(34,211,238,0.22)]'
                    : 'border-white/14 bg-white/[0.07] text-white hover:border-cyan-100/70 hover:bg-white/[0.1]',
                )}
              >
                {date.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <Label
            htmlFor="ticket-quantity"
            className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70"
          >
            Quantity
          </Label>
          <div className="mt-2 grid grid-cols-[48px_1fr_48px] overflow-hidden rounded-md border border-white/14 bg-white/[0.07]">
            <button
              type="button"
              className="grid min-h-12 place-items-center border-r border-white/10 text-white transition hover:bg-white/10 disabled:text-white/30"
              onClick={() =>
                setQuantity((current) => clampQuantity(current - 1))
              }
              disabled={quantity <= 1}
              aria-label="Decrease ticket quantity"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <Input
              id="ticket-quantity"
              name="quantity"
              type="number"
              min={1}
              max={10}
              inputMode="numeric"
              value={quantity}
              onChange={handleQuantityInput}
              required
              className="h-12 rounded-none border-0 bg-transparent text-center text-lg font-black text-white focus-visible:ring-0"
            />
            <button
              type="button"
              className="grid min-h-12 place-items-center border-l border-white/10 text-white transition hover:bg-white/10 disabled:text-white/30"
              onClick={() =>
                setQuantity((current) => clampQuantity(current + 1))
              }
              disabled={quantity >= 10}
              aria-label="Increase ticket quantity"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold leading-6 text-slate-300">
          <input
            type="checkbox"
            required
            className="mt-1 size-4 accent-red-500"
          />
          I understand ticket purchases are final and non-refundable.
        </label>

        {error && (
          <p className="mt-4 rounded-md border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm font-semibold leading-6 text-red-100">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-5 h-12 w-full rounded-md bg-red-500 text-sm font-black uppercase tracking-[0.08em] text-white hover:bg-red-400"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Ticket className="size-4" aria-hidden="true" />
          )}
          {loading ? 'Starting Khalti' : 'Pay with Khalti'}
        </Button>
      </form>
    </div>
  );
}
