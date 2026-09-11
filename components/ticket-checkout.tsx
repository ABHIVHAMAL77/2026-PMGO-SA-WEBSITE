'use client';

import { ChangeEvent, SyntheticEvent, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  Ticket,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
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
  const [selectedId, setSelectedId] = useState(tickets[0]?.id ?? '');
  const [selectedDate, setSelectedDate] = useState(eventDates[0].value);
  const [quantity, setQuantity] = useState(1);
  const [buyer, setBuyer] = useState<BuyerDetails>(initialBuyer);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0],
    [selectedId, tickets],
  );

  const total = selectedTicket ? selectedTicket.amountNpr * quantity : 0;
  const isSeasonalPass = selectedTicket?.id === 'seasonal-pass';
  const selectedDateLabel = isSeasonalPass
    ? '16-19 Sep 2026'
    : eventDates.find((date) => date.value === selectedDate)?.label;

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
          eventDate: isSeasonalPass ? '2026-09-16 to 2026-09-19' : selectedDate,
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
      className="mt-10 grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]"
      data-qa="ticket-grid"
    >
      <div className="grid gap-5 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
        {tickets.map((ticket) => {
          const isSelected = ticket.id === selectedTicket?.id;

          return (
            <article
              key={ticket.id}
              className={cn(
                'ticket-tilt flex min-h-[330px] flex-col rounded-lg border p-6 transition duration-300 sm:p-8',
                isSelected
                  ? 'border-cyan-200 bg-[#0a1429] shadow-[0_28px_92px_rgba(34,211,238,0.18)]'
                  : ticket.featured
                    ? 'border-red-400 bg-[#0a1227] shadow-[0_28px_92px_rgba(239,68,68,0.18)]'
                    : 'border-white/10 bg-white/[0.055] shadow-[0_22px_70px_rgba(0,0,0,0.18)]',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-3xl font-black uppercase leading-tight">
                  {ticket.name}
                </h3>
                {ticket.featured && (
                  <Badge className="rounded-md bg-red-500 text-white">
                    Best Value
                  </Badge>
                )}
              </div>

              <div className="mt-9">
                <p className="text-5xl font-black">{ticket.price}</p>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-cyan-100/62">
                  {ticket.subline}
                </p>
              </div>

              <ul className="mt-8 grid gap-3">
                {ticket.details.map((detail) => (
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

              <Button
                type="button"
                onClick={() => setSelectedId(ticket.id)}
                className={cn(
                  'mt-auto min-h-12 w-full rounded-md text-sm font-black uppercase tracking-[0.08em]',
                  isSelected
                    ? 'bg-cyan-200 text-[#071123] hover:bg-cyan-100'
                    : ticket.featured
                      ? 'bg-red-500 text-white hover:bg-red-400'
                      : 'bg-white text-[#071123] hover:bg-cyan-100',
                )}
                aria-pressed={isSelected}
              >
                <Ticket className="size-4" aria-hidden="true" />
                {isSelected ? 'Selected' : 'Select Pass'}
              </Button>
            </article>
          );
        })}
      </div>

      <form
        className="depth-panel rounded-lg border border-white/12 bg-[#050915]/82 p-5 shadow-[0_30px_120px_rgba(7,13,31,0.5)] backdrop-blur-2xl sm:p-6"
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

        <div className="mt-6 rounded-md border border-white/10 bg-white/[0.055] p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/58">
            Selected pass
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xl font-black uppercase text-white">
                {selectedTicket?.name}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                {selectedTicket?.subline} · {selectedDateLabel}
              </p>
            </div>
            <p className="text-2xl font-black text-white">
              NPR {total.toLocaleString('en-US')}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
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
          <Label
            htmlFor="ticket-date"
            className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70"
          >
            Event date
          </Label>
          <NativeSelect
            id="ticket-date"
            value={isSeasonalPass ? 'all-days' : selectedDate}
            onChange={(event) => {
              setSelectedDate(event.currentTarget.value);
              setError('');
            }}
            disabled={isSeasonalPass}
            className="mt-2 w-full [&_select]:h-12 [&_select]:rounded-md [&_select]:border-white/14 [&_select]:bg-white/[0.07] [&_select]:px-4 [&_select]:pr-10 [&_select]:font-bold [&_select]:text-white [&_select]:focus-visible:border-cyan-200"
          >
            {isSeasonalPass ? (
              <NativeSelectOption value="all-days">
                16-19 Sep 2026 - All days
              </NativeSelectOption>
            ) : (
              eventDates.map((date) => (
                <NativeSelectOption key={date.value} value={date.value}>
                  {date.label}
                </NativeSelectOption>
              ))
            )}
          </NativeSelect>
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
