'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Ticket, TriangleAlert } from 'lucide-react';

import { EVENT_DOORS_OPEN } from '@/lib/tickets';

type LookupResponse = {
  amount?: unknown;
  error?: string;
  status?: unknown;
  transactionId?: unknown;
};

type StatusState = {
  amount?: string;
  message: string;
  status: 'checking' | 'error' | 'success' | 'warning';
  title: string;
  transactionId?: string;
};

const formatAmount = (amount: unknown) => {
  if (typeof amount !== 'number') {
    return undefined;
  }

  return `NPR ${(amount / 100).toLocaleString('en-US')}`;
};

const getStatusState = (response: LookupResponse): StatusState => {
  const status = typeof response.status === 'string' ? response.status : '';

  if (status.toLowerCase() === 'completed') {
    return {
      amount: formatAmount(response.amount),
      message: `Your Khalti payment has been received for ticket processing. ${EVENT_DOORS_OPEN}.`,
      status: 'success',
      title: 'Payment Completed',
      transactionId:
        typeof response.transactionId === 'string'
          ? response.transactionId
          : undefined,
    };
  }

  if (status) {
    return {
      amount: formatAmount(response.amount),
      message: `Khalti returned this payment as ${status}.`,
      status: 'warning',
      title: 'Payment Status',
      transactionId:
        typeof response.transactionId === 'string'
          ? response.transactionId
          : undefined,
    };
  }

  return {
    message: response.error ?? 'Khalti payment verification failed.',
    status: 'error',
    title: 'Verification Needed',
  };
};

export function KhaltiReturnStatus() {
  const [state, setState] = useState<StatusState>({
    message: 'Checking Khalti payment reference.',
    status: 'checking',
    title: 'Checking Payment',
  });

  useEffect(() => {
    let active = true;

    const verifyPayment = async (): Promise<StatusState> => {
      const params = new URLSearchParams(window.location.search);
      const pidx = params.get('pidx');

      if (!pidx) {
        return {
          message: 'No Khalti payment reference was found on this return link.',
          status: 'error',
          title: 'Payment Reference Missing',
        };
      }

      try {
        const response = await fetch('/api/khalti/lookup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pidx }),
        });

        const payload = (await response
          .json()
          .catch(() => ({}))) as LookupResponse;

        return getStatusState(payload);
      } catch {
        return {
          message: 'Payment verification could not reach Khalti right now.',
          status: 'error',
          title: 'Verification Needed',
        };
      }
    };

    void verifyPayment().then((nextState) => {
      if (active) {
        setState(nextState);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const isChecking = state.status === 'checking';
  const Icon = isChecking
    ? Loader2
    : state.status === 'success'
      ? CheckCircle2
      : TriangleAlert;

  return (
    <article className="mx-auto max-w-xl rounded-lg border border-white/12 bg-[#050915]/82 p-6 text-center shadow-[0_30px_120px_rgba(7,13,31,0.54)] backdrop-blur-2xl sm:p-8">
      <div className="mx-auto grid size-14 place-items-center rounded-full border border-white/12 bg-white/[0.07]">
        <Icon
          className={`size-7 ${
            isChecking
              ? 'animate-spin text-cyan-200'
              : state.status === 'success'
                ? 'text-cyan-200'
                : 'text-red-300'
          }`}
          aria-hidden="true"
        />
      </div>
      <p className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-cyan-200">
        PMGO SA Fall
      </p>
      <h1 className="mt-3 text-4xl font-black uppercase leading-none text-white sm:text-5xl">
        {state.title}
      </h1>
      <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-300">
        {state.message}
      </p>

      {(state.amount || state.transactionId) && (
        <div className="mt-6 grid gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 text-left">
          {state.amount && (
            <div className="bg-[#050912]/76 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/58">
                Amount
              </p>
              <p className="mt-1 text-lg font-black text-white">
                {state.amount}
              </p>
            </div>
          )}
          {state.transactionId && (
            <div className="bg-[#050912]/76 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/58">
                Transaction ID
              </p>
              <p className="mt-1 break-all text-sm font-black text-white">
                {state.transactionId}
              </p>
            </div>
          )}
        </div>
      )}

      <Link
        href="/#tickets"
        className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-red-500 px-5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-red-400"
      >
        <Ticket className="size-4" aria-hidden="true" />
        Back to Tickets
      </Link>
    </article>
  );
}
