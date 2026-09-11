export type TicketPlanId =
  | 'general-day-pass'
  | 'vip-day-pass'
  | 'seasonal-pass';

export type TicketPlan = {
  id: TicketPlanId;
  name: string;
  price: string;
  amountNpr: number;
  subline: string;
  details: string[];
  featured?: boolean;
};

export const ticketPlans: TicketPlan[] = [
  {
    id: 'general-day-pass',
    name: 'General Day Pass',
    price: 'NPR 400',
    amountNpr: 400,
    subline: 'per day',
    details: ['Single-day entry', 'General audience access', 'Capacity TBA'],
  },
  {
    id: 'vip-day-pass',
    name: 'VIP Day Pass',
    price: 'NPR 600',
    amountNpr: 600,
    subline: 'per day',
    details: ['Single-day VIP entry', 'VIP access card', 'Capacity TBA'],
  },
  {
    id: 'seasonal-pass',
    name: 'Seasonal Pass',
    price: 'NPR 1,500',
    amountNpr: 1500,
    subline: 'all four days',
    details: ['16-19 September access', 'Best value pass', 'Capacity TBA'],
    featured: true,
  },
];

export const getTicketPlan = (id: string) =>
  ticketPlans.find((ticket) => ticket.id === id);
