import { emptyFields, finalizeFields, MAX_FOLLOWUPS, nextMissingField } from '@/lib/questions';

describe('nextMissingField', () => {
  test('asks location first when nothing is filled', () => {
    expect(nextMissingField('problem', emptyFields(), 0)).toBe('location');
  });

  test('skips filled fields and asks ask next', () => {
    const fields = emptyFields();
    fields.location = 'Hart Middle School';
    expect(nextMissingField('problem', fields, 0)).toBe('ask');
  });

  test('agenda intent includes position', () => {
    const fields = emptyFields();
    fields.location = 'City Hall';
    fields.ask = 'Support the item';
    fields.impact = 'Students';
    expect(nextMissingField('agenda', fields, 0)).toBe('position');
  });

  test('returns done after max follow-ups', () => {
    expect(nextMissingField('problem', emptyFields(), MAX_FOLLOWUPS)).toBe('done');
  });

  test('finalizeFields supplies Pleasanton resident', () => {
    const done = finalizeFields(emptyFields());
    expect(done.speaker.asResident).toBe(true);
  });
});

test('a skipped question is not asked again', () => {
  const fields = { ...emptyFields(), location: 'Hart Middle School' };
  expect(nextMissingField('problem', fields, 1, ['ask'])).toBe('impact');
});
