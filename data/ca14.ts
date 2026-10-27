export type Community = {
  id: string;
  name: string;
  active: boolean;
};

/** CA-14 communities. Only Pleasanton is fully active in this version. */
export const CA14_COMMUNITIES: Community[] = [
  { id: 'pleasanton', name: 'Pleasanton', active: true },
  { id: 'livermore', name: 'Livermore', active: false },
  { id: 'dublin', name: 'Dublin (western part)', active: false },
  { id: 'hayward', name: 'Hayward', active: false },
  { id: 'union_city', name: 'Union City', active: false },
  { id: 'fremont', name: 'Fremont (north side)', active: false },
  { id: 'san_leandro', name: 'San Leandro (parts)', active: false },
  { id: 'castro_valley', name: 'Castro Valley (unincorporated)', active: false },
  { id: 'san_lorenzo', name: 'San Lorenzo (unincorporated)', active: false },
  { id: 'ashland', name: 'Ashland (unincorporated)', active: false },
  { id: 'cherryland', name: 'Cherryland (unincorporated)', active: false },
  { id: 'fairview', name: 'Fairview (unincorporated)', active: false },
  { id: 'sunol', name: 'Sunol (unincorporated)', active: false },
];
