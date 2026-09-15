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
import { EVENT_DOORS_OPEN, isTicketDateSoldOut } from '@/lib/tickets';
import type { TicketPlan } from '@/lib/tickets';

type BuyerDetails = {
  email: string;
  name: string;
  phone: string;
};

type CheckoutResponse = {
  error?: string;
  paymentUrl?: string;
};

const initialBuyer: BuyerDetails = {
  email: '',
  name: '',
  phone: '',
};

const eventDates = [
  { label: '16 Sep 2026', value: '2026-09-16' },
  { label: '17 Sep 2026', value: '2026-09-17' },
  { label: '18 Sep 2026', value: '2026-09-18' },
  { label: '19 Sep 2026', value: '2026-09-19' },
];

const clampQuantity = (value: number) => Math.min(10, Math.max(1, value));

const createEmptyAttendees = (count: number) =>
  Array.from({ length: count }, () => ({ ...initialBuyer }));

export function TicketCheckout({ tickets }: { tickets: TicketPlan[] }) {
  const [selectedDate, setSelectedDate] = useState(eventDates[0].value);
  const [quantity, setQuantity] = useState(1);
  const [attendees, setAttendees] = useState<BuyerDetails[]>(
    createEmptyAttendees(1),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTicket = tickets[0];
  const baseTotal = selectedTicket ? selectedTicket.amountNpr * quantity : 0;
  const vatTotal = selectedTicket
    ? Math.round(baseTotal * selectedTicket.vatRate)
    : 0;
  const total = baseTotal + vatTotal;
  const selectedDateLabel = eventDates.find(
    (date) => date.value === selectedDate,
  )?.label;

  const updateAttendee =
    (index: number, field: keyof BuyerDetails) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.currentTarget;

      setAttendees((current) =>
        current.map((attendee, attendeeIndex) =>
          attendeeIndex === index ? { ...attendee, [field]: value } : attendee,
        ),
      );
      setError('');
    };

  const updateQuantity = (nextQuantity: number) => {
    const next = clampQuantity(nextQuantity);
    setQuantity(next);
    setAttendees((current) =>
      Array.from(
        { length: next },
        (_, index) => current[index] ?? initialBuyer,
      ),
    );
    setError('');
  };

  const handleQuantityInput = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;

    updateQuantity(Number(value) || 1);
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTicket) {
      setError('Please choose a pass first.');
      return;
    }

    if (isTicketDateSoldOut(selectedDate)) {
      setError(`${selectedDateLabel} is sold out.`);
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
          attendees,
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
        <img
          src="/xtreme-can.png"
          alt=""
          className="pointer-events-none absolute bottom-0 left-1/2 hidden h-[48%] max-h-[440px] w-auto -translate-x-1/2 object-contain opacity-95 drop-shadow-[0_28px_60px_rgba(0,0,0,0.45)] xl:block"
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />

        <div className="relative z-10">
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
              Per ticket
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
              <p className="mt-1 text-sm font-semibold text-cyan-100/80">
                {EVENT_DOORS_OPEN}
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

        <div className="mt-5">
          <Label className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70">
            Event date
          </Label>
          <div
            className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
            role="radiogroup"
            aria-label="Choose event date"
          >
            {eventDates.map((date) => {
              const soldOut = isTicketDateSoldOut(date.value);

              return (
                <button
                  key={date.value}
                  type="button"
                  role="radio"
                  aria-checked={selectedDate === date.value}
                  disabled={soldOut}
                  onClick={() => {
                    setSelectedDate(date.value);
                    setError('');
                  }}
                  className={cn(
                    'min-h-14 rounded-md border px-3 text-sm font-black uppercase tracking-[0.06em] transition',
                    soldOut
                      ? 'cursor-not-allowed border-red-300/24 bg-red-500/12 text-red-100/70'
                      : selectedDate === date.value
                        ? 'border-cyan-200 bg-cyan-200 text-[#071123] shadow-[0_16px_40px_rgba(34,211,238,0.22)]'
                        : 'border-white/14 bg-white/[0.07] text-white hover:border-cyan-100/70 hover:bg-white/[0.1]',
                  )}
                >
                  <span className="block">{date.label}</span>
                  {soldOut ? (
                    <span className="mt-1 block text-[0.62rem] tracking-[0.16em]">
                      Sold out
                    </span>
                  ) : null}
                </button>
              );
            })}
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
              onClick={() => updateQuantity(quantity - 1)}
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
              onClick={() => updateQuantity(quantity + 1)}
              disabled={quantity >= 10}
              aria-label="Increase ticket quantity"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70">
                Attendee details
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                Add details for every ticket in this order.
              </p>
            </div>
            <p className="rounded-md border border-red-300/24 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-red-100">
              {EVENT_DOORS_OPEN}. Bring real ID card for gate verification if
              required
            </p>
          </div>

          <div className="mt-4 grid gap-4">
            {attendees.map((attendee, index) => (
              <div
                key={index}
                className="rounded-md border border-white/10 bg-[#070d1c] p-4"
              >
                <p className="text-sm font-black uppercase tracking-[0.12em] text-white">
                  Ticket {index + 1}
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <Label
                      htmlFor={`attendee-name-${index}`}
                      className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70"
                    >
                      Full name
                    </Label>
                    <Input
                      id={`attendee-name-${index}`}
                      value={attendee.name}
                      onChange={updateAttendee(index, 'name')}
                      placeholder="As per ID card"
                      autoComplete={index === 0 ? 'name' : 'off'}
                      required
                      className="mt-2 h-12 rounded-md border-white/14 bg-white/[0.07] px-4 text-white placeholder:text-slate-500 focus-visible:border-cyan-200"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor={`attendee-email-${index}`}
                      className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70"
                    >
                      Gmail / email
                    </Label>
                    <Input
                      id={`attendee-email-${index}`}
                      type="email"
                      value={attendee.email}
                      onChange={updateAttendee(index, 'email')}
                      placeholder="name@gmail.com"
                      autoComplete={index === 0 ? 'email' : 'off'}
                      required
                      className="mt-2 h-12 rounded-md border-white/14 bg-white/[0.07] px-4 text-white placeholder:text-slate-500 focus-visible:border-cyan-200"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor={`attendee-phone-${index}`}
                      className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/70"
                    >
                      WhatsApp
                    </Label>
                    <Input
                      id={`attendee-phone-${index}`}
                      type="tel"
                      value={attendee.phone}
                      onChange={updateAttendee(index, 'phone')}
                      placeholder="+977 98XXXXXXXX"
                      autoComplete={index === 0 ? 'tel' : 'off'}
                      required
                      className="mt-2 h-12 rounded-md border-white/14 bg-white/[0.07] px-4 text-white placeholder:text-slate-500 focus-visible:border-cyan-200"
                    />
                  </div>
                </div>
              </div>
            ))}
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
