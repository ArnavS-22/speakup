import { BODIES } from '@/data/seed';
import {
  AgendaItem,
  AuthorityLevel,
  Body,
  ContactInfo,
  RouteResult,
  Scope,
  TopicTag,
} from '@/lib/types';

const YOUTH_TAGS: TopicTag[] = [
  'youth_programs',
  'youth_spaces',
  'youth_events',
  'teen_services',
];
const BPT_TAGS: TopicTag[] = [
  'pedestrian_safety',
  'bike_infrastructure',
  'trails',
  'traffic',
];
const PARKS_TAGS: TopicTag[] = ['parks', 'recreation_facilities'];
const LIBRARY_TAGS: TopicTag[] = ['library'];
const SCHOOL_DISTRICT_TAGS: TopicTag[] = ['school_policy', 'school_district'];

export type RouteInput = {
  tags: TopicTag[];
  scope: Scope;
  location: string | null;
  preselectedItem?: AgendaItem | null;
  bodies?: Body[];
  agendaItems?: AgendaItem[];
};

function bodyById(id: string, bodies: Body[]): Body {
  const found = bodies.find((b) => b.id === id);
  if (!found) {
    throw new Error(`Missing body ${id}`);
  }
  return found;
}

function hasAny(tags: TopicTag[], set: TopicTag[]): boolean {
  return tags.some((t) => set.includes(t));
}

export function tagOverlap(a: TopicTag[], b: TopicTag[]): number {
  return a.filter((t) => b.includes(t)).length;
}

/**
 * Among upcoming items for a body, pick the one with the most overlapping tags.
 * Returns null when nothing shares a tag.
 */
export function matchAgendaItem(
  body: Body,
  agendaItems: AgendaItem[],
  tags: TopicTag[],
): AgendaItem | null {
  let best: AgendaItem | null = null;
  let bestScore = 0;
  for (const item of agendaItems) {
    if (item.body_id !== body.id) continue;
    const score = tagOverlap(item.topics, tags);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

type Why = Pick<RouteResult, 'reason_en' | 'reason_es' | 'reasonParts'>;

/** en/es text for logs and tests, plus language-neutral parts rendered via i18n `reasons.*`. */
function reason(en: string, es: string, parts: RouteResult['reasonParts']): Why {
  return { reason_en: en, reason_es: es, reasonParts: parts };
}

function result(partial: RouteResult): RouteResult {
  return partial;
}

/**
 * Choose the Pleasanton body that owns these tags, if any.
 * Order matches the spec: school district, BPT, youth, parks, then city-owned topics.
 * Returns null when only a City Council fallback would apply.
 */
export function owningBody(tags: TopicTag[], bodies: Body[]): Body | null {
  if (hasAny(tags, SCHOOL_DISTRICT_TAGS)) {
    return bodyById('pusd_board', bodies);
  }
  if (hasAny(tags, BPT_TAGS)) {
    return bodyById('pleasanton_bpt_committee', bodies);
  }
  if (hasAny(tags, YOUTH_TAGS)) {
    return bodyById('pleasanton_youth_commission', bodies);
  }
  if (hasAny(tags, PARKS_TAGS)) {
    return bodyById('pleasanton_parks_rec', bodies);
  }
  if (hasAny(tags, LIBRARY_TAGS)) {
    return bodyById('pleasanton_library_commission', bodies);
  }
  const council = bodyById('pleasanton_city_council', bodies);
  if (hasAny(tags, council.topics) && !tags.every((t) => t === 'other')) {
    const owned = tags.filter((t) => council.topics.includes(t) && t !== 'other');
    if (owned.length > 0) return council;
  }
  return null;
}

function principalContact(location: string | null): ContactInfo {
  const place = location?.trim();
  const school = place && place.length > 0 ? place : null;
  return {
    kind: 'principal',
    school,
    name_en: school
      ? `Principal of ${school}`
      : "That school's principal",
    name_es: school ? `Dirección de ${school}` : 'La dirección de esa escuela',
    detail_en:
      'A rule that applies to one school site is handled at that school, not by the city. You can still give a general comment to the PUSD Board.',
    detail_es:
      'Una regla de un solo plantel la atiende esa escuela, no la ciudad. Igual puedes dejar un comentario general ante la Junta de PUSD.',
    url: null,
  };
}

/**
 * Deterministic jurisdiction routing for CA-14 / Pleasanton.
 * AI output is only the extracted fields; this function decides body + authority.
 *
 * Rules (in order):
 * 1. federal scope or federal_issue → better_contact, Rep. Aisha Wahab
 * 2. private scope or private_matter → better_contact, not a government matter
 * 3. school_site + single_school → better_contact, that school's principal
 * 4. school_policy / school_district → PUSD Board
 * 5. pedestrian_safety, bike_infrastructure, trails, traffic → BPT Committee
 * 6. youth_programs, youth_spaces, youth_events, teen_services → Youth Commission
 * 7. parks, recreation_facilities → Parks & Recreation
 * 7b. library → Library Commission
 * 8. everything else → City Council (can_listen fallback)
 *
 * Then agenda matching: tag overlap on the chosen body's items.
 * Owned topic + match or general comment on that body → can_act.
 * City Council fallback (no owner) → can_listen.
 */
export function routeIssue(input: RouteInput): RouteResult {
  const bodies = input.bodies ?? BODIES;
  const agendaItems = input.agendaItems ?? [];
  const tags = input.tags;
  const council = bodyById('pleasanton_city_council', bodies);
  const wahab = bodyById('rep_wahab_office', bodies);
  const pusd = bodyById('pusd_board', bodies);

  const actFor = (
    body: Body,
    item: AgendaItem | null,
    why: Why,
    authority: AuthorityLevel = 'can_act',
    extras: Partial<RouteResult> = {},
  ): RouteResult =>
    result({
      body,
      authority,
      agendaItem: item,
      generalComment: !item,
      contact: null,
      keepBody: extras.keepBody ?? null,
      ...why,
      ...extras,
    });

  // Weigh-in on a specific posted item: that item's body can act on it.
  if (input.preselectedItem) {
    const item = input.preselectedItem;
    const body = bodyById(item.body_id, bodies);
    return actFor(
      body,
      item,
      reason(
        `${body.name_en} has this item on an upcoming agenda, so they can take it up.`,
        `${body.name_es} tiene este tema en una agenda próxima, así que pueden tratarlo.`,
        [{ key: 'preselected', params: { bodyId: body.id } }],
      ),
    );
  }

  // 1. Federal
  if (input.scope === 'federal' || tags.includes('federal_issue')) {
    return result({
      body: wahab,
      authority: 'better_contact',
      agendaItem: null,
      generalComment: true,
      keepBody: council,
      contact: {
        kind: 'federal',
        name_en: wahab.name_en,
        name_es: wahab.name_es,
        detail_en:
          'This is a federal issue. The local city cannot pass it. The office of Rep. Aisha Wahab (CA-14) is the federal contact for this district.',
        detail_es:
          'Esto es un asunto federal. La ciudad no puede aprobarlo. La oficina de la Rep. Aisha Wahab (CA-14) es el contacto federal de este distrito.',
        url: wahab.contact_url,
      },
      ...reason(
        'This belongs at the federal level, so the better contact is the office of Rep. Aisha Wahab (CA-14).',
        'Esto corresponde al nivel federal, así que el mejor contacto es la oficina de la Rep. Aisha Wahab (CA-14).',
        [{ key: 'federal' }],
      ),
    });
  }

  // 2. Private
  if (input.scope === 'private' || tags.includes('private_matter')) {
    return result({
      body: council,
      authority: 'better_contact',
      agendaItem: null,
      generalComment: true,
      keepBody: council,
      contact: {
        kind: 'private',
        name_en: 'This is a private matter, not a government one.',
        name_es: 'Esto es un asunto privado, no del gobierno.',
        detail_en:
          'City commissions cannot settle a private dispute or a private business decision. You may still speak during general public comment if you want the city to hear a related public concern.',
        detail_es:
          'Las comisiones no pueden resolver un conflicto privado ni una decisión de un negocio particular. Igual puedes hablar en el comentario público general si quieres que la ciudad escuche una preocupación pública relacionada.',
        url: null,
      },
      ...reason(
        'This looks like a private matter, not something a city body can decide.',
        'Esto parece un asunto privado, no algo que un órgano de la ciudad pueda decidir.',
        [{ key: 'private' }],
      ),
    });
  }

  // 3. Single school site
  if (tags.includes('school_site') && input.scope === 'single_school') {
    return result({
      body: pusd,
      authority: 'better_contact',
      agendaItem: null,
      generalComment: true,
      keepBody: pusd,
      contact: principalContact(input.location),
      ...reason(
        "A single school's rule is handled by that school's principal, not by a city commission.",
        'La regla de una sola escuela la atiende la dirección de esa escuela, no una comisión de la ciudad.',
        [{ key: 'schoolSite' }],
      ),
    });
  }

  const owner = owningBody(tags, bodies);
  if (owner) {
    const item = matchAgendaItem(owner, agendaItems, tags);
    const ownsLine =
      owner.id === 'pleasanton_bpt_committee'
        ? reason(
            'Crosswalks and walking routes are handled by the city, not the school district, so this goes to Bike, Pedestrian & Trails.',
            'Los cruces y las rutas peatonales los atiende la ciudad, no el distrito escolar, así que esto va al Comité de Bicicletas, Peatones y Senderos.',
            [{ key: 'ownsBpt' }],
          )
        : owner.id === 'pleasanton_youth_commission'
          ? reason(
              'Youth programs and teen spaces are the Youth Commission’s topic, so this goes there.',
              'Los programas y espacios para jóvenes son tema de la Comisión Juvenil, así que van ahí.',
              [{ key: 'ownsYouth' }],
            )
          : owner.id === 'pleasanton_parks_rec'
            ? reason(
                'Parks and recreation facilities are handled by the Parks & Recreation Commission.',
                'Los parques e instalaciones de recreación los atiende la Comisión de Parques y Recreación.',
                [{ key: 'ownsParks' }],
              )
            : owner.id === 'pleasanton_library_commission'
              ? reason(
                  'Library hours, programs, and services are handled by the Library Commission.',
                  'El horario, los programas y los servicios de la biblioteca los atiende la Comisión de la Biblioteca.',
                  [{ key: 'ownsLibrary' }],
                )
            : owner.id === 'pusd_board'
              ? reason(
                  'District-wide school policy is handled by the PUSD Board of Education, not the city.',
                  'La política escolar del distrito la atiende la Junta de Educación de PUSD, no la ciudad.',
                  [{ key: 'ownsPusd' }],
                )
              : reason(
                  `${owner.name_en} has authority over this topic.`,
                  `${owner.name_es} tiene autoridad sobre este tema.`,
                  [{ key: 'ownsGeneric', params: { bodyId: owner.id } }],
                );

    if (item) {
      return actFor(owner, item, {
        reason_en: `${ownsLine.reason_en} This relates to Item ${item.item_number ?? '—'} on their next agenda.`,
        reason_es: `${ownsLine.reason_es} Se relaciona con el punto ${item.item_number ?? '—'} de su próxima agenda.`,
        reasonParts: [...ownsLine.reasonParts, { key: 'item', params: { number: item.item_number ?? '—' } }],
      });
    }

    return actFor(owner, null, {
      reason_en: `${ownsLine.reason_en} Nothing matching is on a posted agenda yet, so this is general public comment. They may add it to a future agenda.`,
      reason_es: `${ownsLine.reason_es} Todavía no hay un punto coincidente en una agenda publicada, así que esto es comentario público general. Pueden agregarlo a una agenda futura.`,
      reasonParts: [...ownsLine.reasonParts, { key: 'noItem' }],
    });
  }

  // 8. Fallback: City Council can listen (items not on the agenda / no clear owner)
  return actFor(
    council,
    null,
    reason(
      'No commission clearly owns this topic, so it goes to City Council as general public comment. Commissions can hear comments on items not on the agenda, but generally cannot discuss or act on them at that meeting. They may add it to a future agenda.',
      'Ninguna comisión es claramente dueña de este tema, así que va al Concejo como comentario público general. Pueden escuchar comentarios sobre temas que no están en la agenda, pero por lo general no pueden discutirlos ni actuar en esa reunión. Pueden agregarlo a una agenda futura.',
      [{ key: 'fallback' }],
    ),
    'can_listen',
  );
}

/** After a better_contact result, still produce a usable local general comment. */
export function keepAsGeneralComment(current: RouteResult, bodies: Body[] = BODIES): RouteResult {
  const keep = current.keepBody ?? bodyById('pleasanton_city_council', bodies);
  const listen = keep.id === 'pleasanton_city_council';
  return {
    body: keep,
    authority: listen ? 'can_listen' : 'can_act',
    agendaItem: null,
    generalComment: true,
    contact: current.contact,
    keepBody: null,
    reason_en: listen
      ? 'You asked to keep a local comment. This will be City Council general public comment. They can hear it, but generally cannot act on it that night.'
      : `You asked to keep a comment for ${keep.name_en} as general public comment.`,
    reason_es: listen
      ? 'Pediste conservar un comentario local. Será comentario público general ante el Concejo. Pueden escucharlo, pero por lo general no pueden actuar esa noche.'
      : `Pediste conservar un comentario para ${keep.name_es} como comentario público general.`,
    reasonParts: listen ? [{ key: 'keepCouncil' }] : [{ key: 'keepOther', params: { bodyId: keep.id } }],
  };
}
