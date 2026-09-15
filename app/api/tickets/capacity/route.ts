import {
  DAILY_TICKET_CAPACITY,
  eventDateOptions,
  isTicketDateSoldOut,
} from '@/lib/tickets';
import { getTicketDateCapacity } from '@/lib/sheets';

export async function GET() {
  try {
    const dates = await Promise.all(
      eventDateOptions.map(async (eventDate) => {
        if (isTicketDateSoldOut(eventDate.value)) {
          return {
            capacity: DAILY_TICKET_CAPACITY,
            eventDate: eventDate.value,
            eventDateLabel: eventDate.label,
            remaining: 0,
            sold: DAILY_TICKET_CAPACITY,
            soldOut: true,
          };
        }

        const capacity = await getTicketDateCapacity(eventDate.label);

        if (!capacity) {
          throw new Error('Ticket availability is not configured.');
        }

        const remaining =
          capacity.remaining ?? DAILY_TICKET_CAPACITY - capacity.sold;

        return {
          capacity: capacity.capacity ?? DAILY_TICKET_CAPACITY,
          eventDate: eventDate.value,
          eventDateLabel: eventDate.label,
          remaining,
          sold: capacity.sold,
          soldOut: remaining <= 0,
        };
      }),
    );

    return Response.json(
      { dates },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Ticket availability could not be checked.',
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
        status: 503,
      },
    );
  }
}
