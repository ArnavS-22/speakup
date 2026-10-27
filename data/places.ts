export type Place = {
  id: string;
  name: string;
  kind: 'school' | 'park';
};

/** Pleasanton schools and parks for location quick picks. Names only; no invented contacts. */
export const PLEASANTON_PLACES: Place[] = [
  { id: 'amador', name: 'Amador Valley High School', kind: 'school' },
  { id: 'foothill', name: 'Foothill High School', kind: 'school' },
  { id: 'village', name: 'Village High School', kind: 'school' },
  { id: 'hart', name: 'Hart Middle School', kind: 'school' },
  { id: 'harvest', name: 'Harvest Park Middle School', kind: 'school' },
  { id: 'pms', name: 'Pleasanton Middle School', kind: 'school' },
  { id: 'alisal', name: 'Alisal Elementary School', kind: 'school' },
  { id: 'donlon', name: 'Donlon Elementary School', kind: 'school' },
  { id: 'fairlands', name: 'Fairlands Elementary School', kind: 'school' },
  { id: 'hearst', name: 'Hearst Elementary School', kind: 'school' },
  { id: 'lydiksen', name: 'Lydiksen Elementary School', kind: 'school' },
  { id: 'mohr', name: 'Mohr Elementary School', kind: 'school' },
  { id: 'walnut', name: 'Walnut Grove Elementary School', kind: 'school' },
  { id: 'vintage', name: 'Vintage Hills Elementary School', kind: 'school' },
  { id: 'valley_view', name: 'Valley View Elementary School', kind: 'school' },
  { id: 'community_park', name: 'Community Park', kind: 'park' },
  { id: 'muirwood', name: 'Muirwood Park', kind: 'park' },
  { id: 'sports_park', name: 'Sports Park', kind: 'park' },
  { id: 'kendall', name: 'Ken Mercer Sports Park', kind: 'park' },
  { id: 'downtown_park', name: 'Civic Park', kind: 'park' },
];
