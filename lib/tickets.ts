export type TicketPlanId = 'general-day-pass';

export const DAILY_TICKET_CAPACITY = 500;
export const EVENT_DOORS_OPEN = 'Doors open 3:00 PM onwards';
export const SOLD_OUT_EVENT_DATES = ['2026-09-19'];
export const eventDateOptions = [
  { label: '16 Sep 2026', value: '2026-09-16' },
  { label: '17 Sep 2026', value: '2026-09-17' },
  { label: '18 Sep 2026', value: '2026-09-18' },
  { label: '19 Sep 2026', value: '2026-09-19' },
];

export const isTicketDateSoldOut = (eventDate: string) =>
  SOLD_OUT_EVENT_DATES.includes(eventDate);

export type TicketPlan = {
  id: TicketPlanId;
  name: string;
  price: string;
  amountNpr: number;
  vatRate: number;
  subline: string;
  details: string[];
  featured?: boolean;
};

export const ticketPlans: TicketPlan[] = [
  {
    id: 'general-day-pass',
    name: 'General Pass',
    price: 'NPR 400',
    amountNpr: 400,
    vatRate: 0.13,
    subline: 'per day',
    details: [
      'Single-day entry',
      'General audience access',
      EVENT_DOORS_OPEN,
      'Identity proof may be required at gate',
    ],
  },
];

export const getTicketPlan = (id: string) =>
  ticketPlans.find((ticket) => ticket.id === id);
