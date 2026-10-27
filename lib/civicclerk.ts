import snapshotJson from '@/data/civicclerk-snapshot.json';
import { AgendaItem, NextMeeting, TopicTag } from '@/lib/types';

/**
 * Real Pleasanton meetings and agendas, from the city's CivicClerk system
 * (the same data behind pleasantonca.portal.civicclerk.com).
 *
 * The app fetches it live on launch. If the network is down, it uses the
 * snapshot in data/civicclerk-snapshot.json, which is the same shape.
 */
export const CIVICCLERK_API = 'https://pleasantonca.api.civicclerk.com/v1';
export const CIVICCLERK_PORTAL = 'https://pleasantonca.portal.civicclerk.com/event';

/** CivicClerk category name → the app's commission id. */
export const CATEGORY_TO_BODY: Record<string, string> = {
  'City Council': 'pleasanton_city_council',
  'Bicycle, Pedestrian and Trails Committee': 'pleasanton_bpt_committee',
  'Youth Commission': 'pleasanton_youth_commission',
  'Library Commission': 'pleasanton_library_commission',
  'Parks and Recreation Commission': 'pleasanton_parks_rec',
};

export type CCItem = { n: string; t: string };
export type CCMeeting = {
  eventId: number;
  body: string;
  name: string;
  /** Local Pleasanton wall time, e.g. 2026-11-23T18:30:00 */
  start: string;
  location: string;
  agendaPosted: boolean;
  items: CCItem[];
};
export type CCSnapshot = { source: string; fetchedAt: string; meetings: CCMeeting[] };

export const SNAPSHOT = snapshotJson as CCSnapshot;

// ---------- fetching ----------

async function getJson(url: string, timeoutMs = 8000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Agenda items are nested (sections → items → sub-items). Keep the numbered ones. */
export function flattenItems(nodes: any[] | undefined, out: CCItem[] = []): CCItem[] {
  for (const node of nodes ?? []) {
    const n = String(node?.agendaObjectItemOutlineNumber ?? '').trim();
    const t = stripHtml(String(node?.agendaObjectItemName ?? ''));
    if (/^\d+$/.test(n) && t) out.push({ n, t });
    flattenItems(node?.childItems, out);
  }
  return out;
}

/** CivicClerk stores local wall time with a "Z" suffix; drop it. */
export function localStart(startDateTime: string): string {
  return startDateTime.replace(/Z$/, '').slice(0, 19);
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function fetchCivicClerk(now: Date = new Date()): Promise<CCSnapshot> {
  const from = new Date(now);
  from.setDate(from.getDate() - 90);
  const events: any[] = [];
  for (let skip = 0; skip < 150; skip += 15) {
    const url =
      `${CIVICCLERK_API}/Events?$filter=startDateTime+ge+${isoDay(from)}T00:00:00Z` +
      `&$orderby=startDateTime&$skip=${skip}`;
    const page = await getJson(url);
    const value: any[] = page?.value ?? [];
    events.push(...value);
    if (value.length < 15) break;
  }

  const meetings: CCMeeting[] = [];
  for (const ev of events) {
    const body = CATEGORY_TO_BODY[ev.categoryName ?? ev.eventCategoryName];
    if (!body || /geologic hazard/i.test(ev.eventName ?? '')) continue;
    let agendaPosted = false;
    let items: CCItem[] = [];
    if (ev.agendaId) {
      try {
        const m = await getJson(`${CIVICCLERK_API}/Meetings/${ev.agendaId}`);
        agendaPosted = Boolean(m?.agendaIsPublish);
        if (agendaPosted) items = flattenItems(m?.items);
      } catch {
        // keep the meeting, just without items
      }
    }
    meetings.push({
      eventId: ev.id,
      body,
      name: ev.eventName,
      start: localStart(ev.startDateTime),
      location: stripHtml(ev.eventLocation?.address1 ?? '').replace(/\s+,/g, ','),
      agendaPosted,
      items,
    });
  }
  if (meetings.length === 0) throw new Error('No meetings returned');
  return { source: `${CIVICCLERK_API}/`, fetchedAt: now.toISOString(), meetings };
}

// ---------- turning meetings into app data ----------

/** Standing items every agenda has; they are not decisions to weigh in on. */
const PROCEDURAL = [
  /^public comment/i,
  /minutes/i,
  /^oath of office/i,
  /^friends of the library/i,
  /^subcommittee reports/i,
  /^other brief reports/i,
  /proclamation|commendation|recognition|anniversary/i,
];

const TOPIC_RULES: [TopicTag, RegExp][] = [
  ['pedestrian_safety', /pedestrian|crosswalk|crossing|sidewalk/i],
  ['bike_infrastructure', /bike|bicycl/i],
  ['trails', /\btrails?\b/i],
  ['traffic', /traffic|signal|street resurfacing|transportation|multimodal/i],
  ['parks', /\bparks?\b|playground|plaza|storywalk|bench/i],
  ['recreation_facilities', /recreation|pickleball|courts|sports/i],
  ['library', /library/i],
  ['youth_events', /youth in government day/i],
  ['youth_programs', /youth/i],
  ['housing', /housing|residential|rezon|annexation/i],
  ['public_safety', /fire|emergency|police|cybersecurity/i],
  ['environment', /water|groundwater|energy|pfas|sewer/i],
  ['arts', /civic arts|musical/i],
  ['city_budget', /fee schedule|disbursements|budget|bonds|financing|not.to.exceed|\$\d/i],
];

export function tagItem(title: string): TopicTag[] {
  const tags = TOPIC_RULES.filter(([, re]) => re.test(title)).map(([tag]) => tag);
  return tags.length ? tags : ['other'];
}

export function to12h(start: string): string {
  const [hh, mm] = start.slice(11, 16).split(':').map(Number);
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h = hh % 12 === 0 ? 12 : hh % 12;
  return `${h}:${String(mm).padStart(2, '0')} ${ampm}`;
}

export function portalUrl(eventId: number): string {
  return `${CIVICCLERK_PORTAL}/${eventId}/overview`;
}

export function agendaItemsFrom(snap: CCSnapshot): AgendaItem[] {
  const out: AgendaItem[] = [];
  for (const m of snap.meetings) {
    if (!m.agendaPosted) continue;
    for (const item of m.items) {
      if (PROCEDURAL.some((re) => re.test(item.t))) continue;
      out.push({
        id: `cc-${m.eventId}-${item.n}`,
        body_id: m.body,
        meeting_date: m.start.slice(0, 10),
        meeting_time: to12h(m.start),
        item_number: item.n,
        title: item.t,
        summary_en: null,
        summary_es: null,
        topics: tagItem(item.t),
        source_url: portalUrl(m.eventId),
        is_demo: false,
      });
    }
  }
  return out;
}

/** Next meeting per commission, on or after today (local). */
export function nextMeetings(snap: CCSnapshot, now: Date = new Date()): Record<string, NextMeeting> {
  const today = isoDay(now);
  const out: Record<string, NextMeeting> = {};
  const sorted = [...snap.meetings].sort((a, b) => a.start.localeCompare(b.start));
  for (const m of sorted) {
    if (m.start.slice(0, 10) < today || out[m.body]) continue;
    out[m.body] = {
      date: m.start.slice(0, 10),
      time: to12h(m.start),
      location: m.location || null,
      name: m.name,
      agendaPosted: m.agendaPosted,
      source_url: portalUrl(m.eventId),
    };
  }
  return out;
}

/** The speaking rule, read from the agendas themselves. */
export function speakingRule(snap: CCSnapshot, bodyId: string): string | null {
  for (const m of snap.meetings) {
    if (m.body !== bodyId) continue;
    const pc = m.items.find((i) => /^public comment/i.test(i.t));
    const minutes = pc?.t.match(/limited to (\d+) minutes/i)?.[1];
    if (minutes) return minutes;
  }
  return null;
}
