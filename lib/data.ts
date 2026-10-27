import { BODIES, PUSD_SOURCE } from '@/data/seed';
import {
  CCSnapshot,
  SNAPSHOT,
  agendaItemsFrom,
  fetchCivicClerk,
  nextMeetings,
  speakingRule,
} from '@/lib/civicclerk';
import { AgendaItem, Body, NextMeeting } from '@/lib/types';

export type DataSource = 'live' | 'snapshot';

export type CivicData = {
  bodies: Body[];
  agendaItems: AgendaItem[];
  source: DataSource;
  fetchedAt: string;
};

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** PUSD posts on its own site: regular meetings on the 2nd and 4th Thursday, open session 6:00 PM. */
export function nextPusdMeeting(now: Date = new Date()): NextMeeting {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < 62; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const nth = Math.ceil(d.getDate() / 7);
    if (d.getDay() === 4 && (nth === 2 || nth === 4)) {
      return {
        date: isoDay(d),
        time: '6:00 PM',
        location: 'District Office Boardroom, 5758 W. Las Positas Blvd., Pleasanton',
        name: 'Board of Education Regular Meeting',
        agendaPosted: false,
        source_url: PUSD_SOURCE,
      };
    }
  }
  throw new Error('no PUSD date');
}

export function formatMeetingDate(date: string, time?: string | null): string {
  const [y, m, d] = date.split('-').map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return time ? `${label}, ${time}` : label;
}

/** Fill each city commission with its real next meeting and speaking rule. */
export function applySnapshot(bodies: Body[], snap: CCSnapshot, now: Date = new Date()): Body[] {
  const next = nextMeetings(snap, now);
  return bodies.map((body) => {
    if (body.id === 'pusd_board') {
      const m = nextPusdMeeting(now);
      return { ...body, next_meeting: m, location: m.location };
    }
    if (body.level !== 'city') return body;
    const meeting = next[body.id] ?? null;
    const minutes = speakingRule(snap, body.id);
    const i18n = body.i18n
      ? Object.fromEntries(Object.entries(body.i18n).map(([k, v]) => [k, { name: v?.name }]))
      : undefined;
    return {
      ...body,
      i18n,
      next_meeting: meeting,
      meeting_pattern: meeting ? formatMeetingDate(meeting.date, meeting.time) : null,
      location: meeting?.location ?? null,
      time_limit_minutes: minutes ? Number(minutes) : body.time_limit_minutes,
      how_to_speak_en: minutes ? `Public comment. Speakers are limited to ${minutes} minutes.` : null,
      how_to_speak_es: minutes ? `Comentario público. Cada orador tiene un límite de ${minutes} minutos.` : null,
      contact_url: meeting?.source_url ?? body.contact_url,
      verified: true,
    };
  });
}

export function civicDataFrom(snap: CCSnapshot, source: DataSource, now: Date = new Date()): CivicData {
  return {
    bodies: applySnapshot(BODIES, snap, now),
    agendaItems: agendaItemsFrom(snap),
    source,
    fetchedAt: snap.fetchedAt,
  };
}

/** Bundled copy, available instantly on first render. */
export const INITIAL_DATA: CivicData = civicDataFrom(SNAPSHOT, 'snapshot');

/** Live from CivicClerk; falls back to the bundled snapshot. */
export async function loadCivicData(): Promise<CivicData> {
  try {
    const live = await fetchCivicClerk();
    return civicDataFrom(live, 'live');
  } catch {
    return INITIAL_DATA;
  }
}

/** Items from agendas on or after today; the only ones a comment can be "on". */
export function upcomingItems(items: AgendaItem[], now: Date = new Date()): AgendaItem[] {
  const today = isoDay(now);
  return items.filter((i) => i.meeting_date >= today);
}

/** Items from agendas before today, newest first. */
export function recentItems(items: AgendaItem[], now: Date = new Date()): AgendaItem[] {
  const today = isoDay(now);
  return items
    .filter((i) => i.meeting_date < today)
    .sort((a, b) => b.meeting_date.localeCompare(a.meeting_date));
}
