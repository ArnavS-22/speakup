import { BODIES } from '@/data/seed';
import { AGENDA_ITEMS } from './fixtures/agenda';
import { keepAsGeneralComment, matchAgendaItem, routeIssue } from '@/lib/routing';

const bodies = BODIES;
const agendaItems = AGENDA_ITEMS;

describe('routeIssue', () => {
  test('crosswalk issue routes to BPT and can_act', () => {
    const result = routeIssue({
      tags: ['pedestrian_safety'],
      scope: 'city',
      location: 'Hart Middle School',
      bodies,
      agendaItems,
    });
    expect(result.body.id).toBe('pleasanton_bpt_committee');
    expect(result.authority).toBe('can_act');
    expect(result.agendaItem?.body_id).toBe('pleasanton_bpt_committee');
  });

  test('teen space routes to Youth Commission', () => {
    const result = routeIssue({
      tags: ['youth_spaces'],
      scope: 'city',
      location: null,
      bodies,
      agendaItems,
    });
    expect(result.body.id).toBe('pleasanton_youth_commission');
    expect(result.authority).toBe('can_act');
  });

  test('federal issue is better_contact for Rep. Wahab', () => {
    const result = routeIssue({
      tags: ['federal_issue'],
      scope: 'federal',
      location: null,
      bodies,
      agendaItems,
    });
    expect(result.authority).toBe('better_contact');
    expect(result.body.id).toBe('rep_wahab_office');
    expect(result.contact?.kind).toBe('federal');
    const kept = keepAsGeneralComment(result, bodies);
    expect(kept.body.id).toBe('pleasanton_city_council');
    expect(kept.authority).toBe('can_listen');
  });

  test('single-school bathroom issue is better_contact principal', () => {
    const result = routeIssue({
      tags: ['school_site'],
      scope: 'single_school',
      location: 'Hart Middle School',
      bodies,
      agendaItems,
    });
    expect(result.authority).toBe('better_contact');
    expect(result.contact?.kind).toBe('principal');
    expect(result.contact?.name_en).toContain('Hart');
    expect(result.keepBody?.id).toBe('pusd_board');
  });

  test('unknown topic falls back to City Council can_listen', () => {
    const result = routeIssue({
      tags: ['other'],
      scope: 'unclear',
      location: null,
      bodies,
      agendaItems,
    });
    expect(result.body.id).toBe('pleasanton_city_council');
    expect(result.authority).toBe('can_listen');
    expect(result.generalComment).toBe(true);
  });

  test('agenda intent with a preselected item is can_act with that item', () => {
    const item = agendaItems.find((i) => i.id === 'demo-youth-gov-day-2027');
    expect(item).toBeTruthy();
    const result = routeIssue({
      tags: ['youth_events'],
      scope: 'city',
      location: null,
      preselectedItem: item,
      bodies,
      agendaItems,
    });
    expect(result.authority).toBe('can_act');
    expect(result.body.id).toBe('pleasanton_youth_commission');
    expect(result.agendaItem?.id).toBe('demo-youth-gov-day-2027');
  });
});

describe('matchAgendaItem', () => {
  test('picks overlapping tags for the same body', () => {
    const body = bodies.find((b) => b.id === 'pleasanton_bpt_committee')!;
    const match = matchAgendaItem(body, agendaItems, ['pedestrian_safety']);
    expect(match?.body_id).toBe(body.id);
    expect(match?.topics).toContain('pedestrian_safety');
  });
});

describe('library', () => {
  test('library hours route to the Library Commission', () => {
    const result = routeIssue({ tags: ['library'], scope: 'city', location: null, bodies, agendaItems });
    expect(result.body.id).toBe('pleasanton_library_commission');
    expect(result.authority).toBe('can_act');
    expect(result.agendaItem?.id).toBe('demo-library-hours');
  });
});
