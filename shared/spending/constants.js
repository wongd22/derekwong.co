/** Plan figures for the spending command center. These are the live rules. */

export const TIMEZONE = 'Asia/Hong_Kong';

export const EVERYDAY_TARGET_2026 = 12227;
export const PLAN_CAP = 14412;
export const TYPICAL_WELL_ON_HALF = 5866;
export const DECEMBER_2026_TAX = 72562;

export const INCOME = 77580;
export const FAMILY_SUPPORT = 10000;
export const MORTGAGE = 10000;
export const INSURANCE = 1667.54;
export const FIXED_COMMITTED = 21667.54;
export const MPF = 1500;
export const SURPLUS_POLICY = 40000;
export const ENJOYMENT_SLICE = 5000;

export const PERSONAL_FORM = 'https://forms.gle/KQuSFhzTKtXgf98k8';
export const WELLON_FORM = 'https://forms.gle/5J55inBAGSwi6wrD8';

export const YEARLY_WATCH = [
  { id: 'combined', label: 'Combined', target: 156000 },
  { id: 'personal', label: 'My expense', target: 72000 },
  { id: 'trip', label: 'Trip', target: 48000 },
  { id: 'normal', label: 'Meal and transport', target: 36000 },
  { id: 'love', label: 'What I love', target: 24000 },
  { id: 'special', label: 'Family, clothes, and Karen', target: 12000 },
];

export const ENVELOPES = {
  normal: {
    title: 'Normal',
    written: 3000,
    tone: 'sand',
    blurb: 'Meal and transportation. The written 3,000 is composition only.',
  },
  love: {
    title: 'What I love',
    written: 2000,
    tone: 'clay',
    blurb: 'Entertainment and books. The written 2,000 is composition only.',
  },
  special: {
    title: 'Special',
    written: 1000,
    tone: 'sage',
    blurb: 'Family and clothes, with Karen included in this total and listed on its own line. The written 1,000 is composition only.',
  },
  trip: {
    title: 'Trip',
    written: 4000,
    tone: 'slate',
    blurb: 'Large discretionary. The written 4,000 is a month slice of 48,000 a year, not the live cap.',
  },
  wellOn: {
    title: 'Well On half',
    written: 7000,
    tone: 'stone',
    blurb: 'Half of every Well On amount, whoever paid. The written 7,000 is composition only.',
  },
  karen: {
    title: 'Karen',
    written: null,
    tone: 'blush',
    blurb: 'Its own line so it is never treated as coffee. Counted inside Special for the written total.',
  },
  other: {
    title: 'Other personal',
    written: null,
    tone: 'mist',
    blurb: 'Personal categories that do not match a known envelope. Treated as discretionary until you reclassify them.',
  },
};

export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const STALE_WELL_ON_DAYS = 4;
export const UNDERLOG_START_DAY = 5;
export const YEARLY_CLOSE_RATIO = 0.85;
