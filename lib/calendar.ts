import { AgendaItem, Body } from '@/lib/types';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

/** The agenda item's meeting if there is one, otherwise the commission's next posted meeting. */
function parseMeeting(item: AgendaItem | null, body: Body): Date | null {
  const dateStr = item?.meeting_date ?? body.next_meeting?.date;
  if (!dateStr) return null;
  const time = item?.meeting_time ?? body.next_meeting?.time;
  if (!time) return null;
  const iso = `${dateStr}T${to24(time)}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function to24(time: string): string {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '19:00:00';
  let hour = Number(match[1]);
  const min = match[2];
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${min}:00`;
}

export async function addMeetingToCalendar(input: {
  body: Body;
  item: AgendaItem | null;
  title: string;
  notes: string;
}): Promise<'added' | 'denied' | 'unavailable'> {
  const start = parseMeeting(input.item, input.body);
  if (!start) return 'unavailable';

  const perm = await Calendar.requestCalendarPermissionsAsync();
  if (perm.status !== 'granted') return 'denied';

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable =
    calendars.find((c) => c.allowsModifications && c.source?.name === 'iCloud') ||
    calendars.find((c) => c.allowsModifications);
  if (!writable) return 'unavailable';

  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const location = input.body.next_meeting?.location ?? input.body.location ?? undefined;

  await Calendar.createEventAsync(writable.id, {
    title: input.title,
    startDate: start,
    endDate: end,
    location,
    notes: input.notes,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  void Platform;
  return 'added';
}
