export type TicketPlanId = 'general-day-pass';

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
      '13% VAT added at checkout',
      'Identity proof may be required at gate',
    ],
  },
];

export const getTicketPlan = (id: string) =>
  ticketPlans.find((ticket) => ticket.id === id);
