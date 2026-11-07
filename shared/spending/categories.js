function norm(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/\s+/g, ' ');
}

const PERSONAL_RULES = [
  { test: /^meals?$/, envelope: 'normal', role: 'discretionary', name: 'Meal' },
  { test: /^transport(?:ation)?$/, envelope: 'normal', role: 'mixed', name: 'Transportation' },
  { test: /^entertainment$/, envelope: 'love', role: 'discretionary', name: 'Entertainment' },
  { test: /^books?$/, envelope: 'love', role: 'discretionary', name: 'Book' },
  { test: /^family$/, envelope: 'special', role: 'mixed', name: 'Family' },
  { test: /^clothes\b/, envelope: 'special', role: 'discretionary', name: 'Clothes' },
  { test: /^trip$/, envelope: 'trip', role: 'discretionary', name: 'Trip' },
  { test: /^karen$/, envelope: 'karen', role: 'protected', name: 'Karen' },
];

const ROLE_LABEL = {
  discretionary: 'Discretionary',
  mixed: 'Mixed',
  protected: 'Protected',
  necessary: 'Necessary',
  fixed: 'Near fixed',
  ignore: 'Ignored for pace',
  unknown: 'Other',
};

export function roleLabel(role) {
  return ROLE_LABEL[role] || 'Other';
}

export function classifyPersonal(category) {
  const key = norm(category);
  const rule = PERSONAL_RULES.find((item) => item.test.test(key));
  if (!rule) {
    const name = String(category || '').trim() || 'Uncategorized';
    return {
      envelope: 'other',
      role: 'discretionary',
      name,
      known: false,
    };
  }
  return { ...rule, known: true };
}

function includesAny(text, original, keys) {
  return keys.some((key) => text.includes(key) || original.includes(key));
}

/**
 * Well On categories are free text. Pay by is not used here.
 * Unknown text defaults to discretionary so it can still raise a warning.
 */
export function classifyWellOn(category) {
  const original = String(category || '').trim();
  const text = norm(original);
  if (!text) {
    return { role: 'unknown', name: 'Uncategorized', known: false };
  }

  const oneOff = [
    'lunch deposit',
    'cake',
    'facial',
    'concert',
    'sogo',
    'manta',
    'appliance',
    'furniture',
  ];
  if (includesAny(text, original, oneOff)) {
    return { role: 'discretionary', name: original, known: true };
  }

  if (
    text.includes('buy house')
    || text === 'deposit'
    || text.includes('house deposit')
  ) {
    return { role: 'ignore', name: original, known: true };
  }

  const nearFixed = [
    '管理費',
    '電費',
    '差餉',
    '水費',
    '煤氣',
    'house service',
    'management fee',
    'hkt',
    'netvigator',
    'parking',
    'townplace',
    'towngas',
    'town gas',
  ];
  if (includesAny(text, original, nearFixed)) {
    return { role: 'fixed', name: original, known: true };
  }

  const paceable = [
    'grocery',
    'parknshop',
    'partnshop',
    'taobao',
    '超市',
    'cat',
    '洗冷氣',
  ];
  if (includesAny(text, original, paceable) || text === 'cat' || text.startsWith('cat ')) {
    return { role: 'necessary', name: original, known: true };
  }

  const discretionary = [
    'meal',
    'taxi',
    'uber',
    'entertainment',
    'clothes',
    'cloth',
  ];
  if (includesAny(text, original, discretionary)) {
    return { role: 'discretionary', name: original, known: true };
  }

  return { role: 'unknown', name: original, known: false };
}

export function hisShare(source, amount) {
  return source === 'wellOn' ? amount / 2 : amount;
}

export function countsAsDiscretionary(role) {
  return role === 'discretionary' || role === 'unknown';
}
