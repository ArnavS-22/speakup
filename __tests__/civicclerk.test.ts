import { SNAPSHOT, flattenItems, localStart, nextMeetings, tagItem, to12h } from '@/lib/civicclerk';
import { civicDataFrom, upcomingItems } from '@/lib/data';
import { routeIssue } from '@/lib/routing';

const now = new Date(2026, 9, 26, 12, 0, 0); // Oct 26, 2026

describe('CivicClerk data', () => {
  it('reads local wall time and formats it', () => {
    expect(localStart('2026-11-23T18:30:00Z')).toBe('2026-11-23T18:30:00');
    expect(to12h('2026-11-23T18:30:00')).toBe('6:30 PM');
  });

  it('keeps numbered items from nested agendas', () => {
    const items = flattenItems([
      { agendaObjectItemOutlineNumber: 'A', agendaObjectItemName: 'Consent', childItems: [
        { agendaObjectItemOutlineNumber: '3', agendaObjectItemName: '<p>Approve a <b>bikeway</b></p>' },
      ] },
    ]);
    expect(items).toEqual([{ n: '3', t: 'Approve a bikeway' }]);
  });

  it('tags agenda items by keyword', () => {
    expect(tagItem('Pedestrian Safety Crossing Enhancements Project')).toContain('pedestrian_safety');
    expect(tagItem('Discuss and provide feedback on the 2027 Pleasanton Library Card Design Contest')).toContain('library');
  });

  it('finds each commission’s next meeting', () => {
    const next = nextMeetings(SNAPSHOT, now);
    expect(next.pleasanton_bpt_committee.date).toBe('2026-11-23');
    expect(next.pleasanton_bpt_committee.time).toBe('6:30 PM');
  });

  it('routes the Hart crosswalk to the BPT Committee’s real next meeting', () => {
    const data = civicDataFrom(SNAPSHOT, 'snapshot', now);
    const r = routeIssue({
      tags: ['pedestrian_safety'],
      scope: 'city',
      location: 'Hart Middle School',
      bodies: data.bodies,
      agendaItems: upcomingItems(data.agendaItems, now),
    });
    expect(r.body.id).toBe('pleasanton_bpt_committee');
    expect(r.authority).toBe('can_act');
    expect(r.body.next_meeting?.date).toBe('2026-11-23');
    expect(r.body.how_to_speak_en).toBe('Public comment. Speakers are limited to 3 minutes.');
  });
});
