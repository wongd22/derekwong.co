import {
  DECEMBER_2026_TAX,
  ENVELOPES,
  EVERYDAY_TARGET_2026,
  MONTH_LABELS,
  PERSONAL_FORM,
  PLAN_CAP,
  STALE_WELL_ON_DAYS,
  TYPICAL_WELL_ON_HALF,
  UNDERLOG_START_DAY,
  WELLON_FORM,
  YEARLY_CLOSE_RATIO,
  YEARLY_WATCH,
} from './constants.js';
import {
  classifyPersonal,
  classifyWellOn,
  countsAsDiscretionary,
  hisShare,
  roleLabel,
} from './categories.js';
import { daysInMonth, hongKongParts, money, monthKey } from './parse.js';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ENVELOPE_ORDER = ['normal', 'love', 'special', 'trip', 'wellOn', 'karen', 'other'];

const ENVELOPE_ROLE = {
  normal: 'mixed',
  love: 'discretionary',
  special: 'mixed',
  trip: 'discretionary',
  wellOn: 'mixed',
  karen: 'protected',
  other: 'discretionary',
};

const CUT_ORDER = 'Cut meals first, then entertainment, then shared meals and extra taxis, then clothes and similar one offs.';

function shortDate(date) {
  const parts = hongKongParts(date);
  return `${parts.day} ${SHORT_MONTHS[parts.month - 1]}`;
}

function makeBucket() {
  return {
    spent: 0,
    entries: 0,
    last: null,
    categories: new Map(),
  };
}

function addToBucket(bucket, name, his, role, at) {
  bucket.spent += his;
  bucket.entries += 1;
  if (!bucket.last || at > bucket.last) bucket.last = at;
  const key = name || 'Uncategorized';
  const current = bucket.categories.get(key) || { name: key, spent: 0, entries: 0, role };
  current.spent += his;
  current.entries += 1;
  current.role = role;
  bucket.categories.set(key, current);
}

function resolveTarget(year, month, totalsByMonth) {
  if (year < 2027) {
    return {
      amount: EVERYDAY_TARGET_2026,
      label: 'January through October 2026',
    };
  }
  let total = 0;
  let cursorYear = year;
  let cursorMonth = month;
  for (let i = 0; i < 12; i += 1) {
    cursorMonth -= 1;
    if (cursorMonth === 0) {
      cursorMonth = 12;
      cursorYear -= 1;
    }
    total += totalsByMonth.get(monthKey(cursorYear, cursorMonth)) || 0;
  }
  return {
    amount: money(total / 12),
    label: 'Trailing 12 completed months',
  };
}

function resolveTax(year, month, taxInfo) {
  if (month !== 12) return { taxMonth: false, taxAmount: 0, taxSource: null };
  const info = taxInfo || { read: false, foundHeader: false, amount: null };
  if (info.amount && info.amount > 0) {
    return { taxMonth: true, taxAmount: money(info.amount), taxSource: 'sheet' };
  }
  if (year === 2026 && (info.read === false || info.foundHeader === false)) {
    return {
      taxMonth: true,
      taxAmount: DECEMBER_2026_TAX,
      taxSource: 'december_2026_plan',
    };
  }
  return { taxMonth: false, taxAmount: 0, taxSource: null };
}

export function assessWellOnLogging({
  wellOnHalf,
  latest,
  now,
  day,
  days,
  isCurrent,
}) {
  const reasons = [];
  if (isCurrent) {
    if (!latest) {
      if (day >= UNDERLOG_START_DAY) reasons.push('No Well On entries yet this month.');
    } else {
      const ageDays = (now.getTime() - latest.getTime()) / 86400000;
      if (ageDays > STALE_WELL_ON_DAYS) {
        reasons.push('The latest Well On entry is more than a few days old.');
      }
    }
    if (day >= UNDERLOG_START_DAY) {
      const expected = TYPICAL_WELL_ON_HALF * (day / days);
      const bar = Math.min(TYPICAL_WELL_ON_HALF * 0.5, expected * 0.5);
      if (wellOnHalf < bar) {
        reasons.push('Well On half is far below the usual share of about HK$5,866.');
      }
    }
  } else if (wellOnHalf < TYPICAL_WELL_ON_HALF * 0.5) {
    reasons.push('Well On half is far below the usual completed month share of about HK$5,866.');
  }
  return { active: reasons.length > 0, reasons };
}

function judgeStatus({ taxMonth, hisSpend, projected, everydayTarget, discretionaryHis }) {
  if (taxMonth) {
    return {
      code: 'tax_month',
      label: 'Protect cash',
      detail: 'This is a tax month. Discretionary spend is off. Household bills can still arrive. Everyday and plan safe room are not offered.',
      cutOrder: 'Do not add coffee, extra dining, entertainment, impulse clothes, or extra taxis. Necessities and household bills continue.',
      overageIsDiscretionary: false,
    };
  }

  const over = money(hisSpend - everydayTarget);
  const overageIsDiscretionary = over > 0 && money(discretionaryHis) + 0.009 >= over;
  const necessitiesAlreadyOver = over > 0 && !overageIsDiscretionary;
  const pastCap = projected > PLAN_CAP + 0.004;

  if (pastCap || overageIsDiscretionary) {
    const detail = necessitiesAlreadyOver
      ? 'This month is past the plan safe cap. Do not add coffee, extra dining, entertainment, impulse clothes, or extra taxis. Do not cut family, Karen, utilities, groceries, or cat care to chase the number.'
      : 'No more coffee, extra dining, entertainment, impulse clothes, or extra taxis. Necessities continue.';
    return {
      code: 'stop',
      label: 'Stop discretionary',
      detail,
      cutOrder: CUT_ORDER,
      overageIsDiscretionary,
    };
  }

  if (projected > everydayTarget + 0.004) {
    return {
      code: 'tighten',
      label: 'Tighten extras',
      detail: 'Cut coffee, extra meals, and nonessential taxis first. The surplus split can still be funded if extras ease off.',
      cutOrder: CUT_ORDER,
      overageIsDiscretionary: false,
    };
  }

  return {
    code: 'on_track',
    label: 'On track',
    detail: 'Small spends are fine.',
    cutOrder: null,
    overageIsDiscretionary: false,
  };
}

function classifyRow(row) {
  if (row.source === 'wellOn') {
    const found = classifyWellOn(row.category);
    return { ...found, envelope: 'wellOn' };
  }
  return classifyPersonal(row.category);
}

export function buildDashboard({
  rows = [],
  skipped = 0,
  taxInfo = null,
  year,
  month,
  now = new Date(),
}) {
  const safeRows = rows.filter((row) => row?.at instanceof Date && !Number.isNaN(row.at.getTime()));
  const nowParts = hongKongParts(now);
  const isCurrent = nowParts.year === year && nowParts.month === month;
  const days = daysInMonth(year, month);
  const day = isCurrent ? nowParts.day : days;

  const totalsByMonth = new Map();
  const yearly = {
    combined: 0,
    personal: 0,
    trip: 0,
    normal: 0,
    love: 0,
    special: 0,
  };

  const monthRows = [];
  for (const row of safeRows) {
    const parts = hongKongParts(row.at);
    const share = hisShare(row.source, row.amount);
    const key = monthKey(parts.year, parts.month);
    totalsByMonth.set(key, (totalsByMonth.get(key) || 0) + share);

    if (parts.year === year && parts.month <= month) {
      yearly.combined += share;
      if (row.source === 'personal') {
        yearly.personal += row.amount;
        const kind = classifyPersonal(row.category);
        if (kind.envelope === 'trip') yearly.trip += row.amount;
        if (kind.envelope === 'normal') yearly.normal += row.amount;
        if (kind.envelope === 'love') yearly.love += row.amount;
        if (kind.envelope === 'special' || kind.envelope === 'karen') yearly.special += row.amount;
      }
    }

    if (parts.year === year && parts.month === month) monthRows.push(row);
  }

  const buckets = Object.fromEntries(ENVELOPE_ORDER.map((id) => [id, makeBucket()]));
  let personalRaw = 0;
  let wellRaw = 0;
  let discretionaryRaw = 0;
  let personalCount = 0;
  let wellCount = 0;
  let latestWellOn = null;
  const recent = [];

  monthRows.forEach((row, index) => {
    const kind = classifyRow(row);
    const share = hisShare(row.source, row.amount);
    if (row.source === 'personal') {
      personalRaw += row.amount;
      personalCount += 1;
    } else {
      wellRaw += row.amount;
      wellCount += 1;
      if (!latestWellOn || row.at > latestWellOn) latestWellOn = row.at;
    }
    if (countsAsDiscretionary(kind.role)) discretionaryRaw += share;

    addToBucket(buckets[kind.envelope], kind.name, share, kind.role, row.at);
    if (kind.envelope === 'karen') {
      addToBucket(buckets.special, kind.name, share, kind.role, row.at);
    }

    recent.push({
      id: `${row.source}.${index}`,
      source: row.source,
      sourceLabel: row.source === 'wellOn' ? 'Well On' : 'Personal',
      category: kind.name,
      amount: money(row.amount),
      hisShare: money(share),
      payer: row.payer,
      remarks: String(row.remarks || '').slice(0, 180),
      at: row.at.toISOString(),
      dateLabel: shortDate(row.at),
      envelopeId: kind.envelope,
      role: kind.role,
      roleLabel: roleLabel(kind.role),
    });
  });

  recent.sort((a, b) => (a.at < b.at ? 1 : -1));

  const personalSpent = money(personalRaw);
  const wellOnSpent = money(wellRaw);
  const wellOnHalf = money(wellRaw / 2);
  const hisSpend = money(personalRaw + wellRaw / 2);
  const discretionaryHis = money(discretionaryRaw);
  const target = resolveTarget(year, month, totalsByMonth);
  const everydayTarget = target.amount;
  const projectedMonthEnd = money(hisSpend * (days / day));
  const evenPaceAverage = money(everydayTarget * (day / days));
  const evenPaceCap = money(PLAN_CAP * (day / days));
  const tax = resolveTax(year, month, taxInfo);
  const underLogged = assessWellOnLogging({
    wellOnHalf,
    latest: latestWellOn,
    now,
    day,
    days,
    isCurrent,
  });
  const status = judgeStatus({
    taxMonth: tax.taxMonth,
    hisSpend,
    projected: projectedMonthEnd,
    everydayTarget,
    discretionaryHis,
  });

  const remainingAverage = tax.taxMonth ? null : Math.max(0, money(everydayTarget - hisSpend));
  const remainingPlan = tax.taxMonth ? null : Math.max(0, money(PLAN_CAP - hisSpend));
  const offerRoom = !tax.taxMonth && !underLogged.active;

  let remainingCaption = 'Left against the average';
  let planCaption = 'Left against the plan safe cap';
  if (tax.taxMonth) {
    remainingCaption = 'Not offered this tax month';
    planCaption = 'Not offered this tax month';
  } else if (underLogged.active) {
    remainingCaption = 'Face value, not room';
    planCaption = 'Face value, not room';
  } else if (status.code === 'stop' && remainingAverage === 0) {
    remainingCaption = 'Already past the average';
  }

  const headline = underLogged.active && !tax.taxMonth ? 'Well On looks thin' : status.label;
  const subhead = underLogged.active && !tax.taxMonth
    ? 'Do not treat the leftover as room to spend.'
    : status.detail;

  const envelopes = ENVELOPE_ORDER.filter((id) => id !== 'other' || buckets[id].entries > 0).map((id) => {
    const bucket = buckets[id];
    const meta = ENVELOPES[id];
    const categories = [...bucket.categories.values()]
      .map((category) => ({
        name: category.name,
        spent: money(category.spent),
        entries: category.entries,
        role: category.role,
        roleLabel: roleLabel(category.role),
      }))
      .sort((a, b) => b.spent - a.spent);
    return {
      id,
      title: meta.title,
      spent: money(bucket.spent),
      written: meta.written,
      entries: bucket.entries,
      lastLogged: bucket.last ? bucket.last.toISOString() : null,
      lastLoggedLabel: bucket.last ? shortDate(bucket.last) : '',
      role: ENVELOPE_ROLE[id],
      roleLabel: roleLabel(ENVELOPE_ROLE[id]),
      blurb: meta.blurb,
      tone: meta.tone,
      categories,
      overWritten: meta.written != null && bucket.spent > meta.written + 0.004,
      fullSpent: id === 'wellOn' ? wellOnSpent : null,
      source: id === 'wellOn' ? 'wellOn' : 'personal',
    };
  });

  const yearlyWatch = YEARLY_WATCH.map((item) => {
    const spent = money(yearly[item.id] || 0);
    const ratio = item.target ? spent / item.target : 0;
    let state = 'ok';
    if (spent > item.target + 0.004) state = 'over';
    else if (ratio >= YEARLY_CLOSE_RATIO) state = 'close';
    const stateLabel = state === 'over'
      ? 'Over the yearly watch'
      : state === 'close'
        ? 'Close to the yearly watch'
        : 'Within the yearly watch';
    return {
      id: item.id,
      label: item.label,
      spent,
      target: item.target,
      percent: Math.round(ratio * 100),
      state,
      stateLabel,
    };
  });

  const contextNote = !tax.taxMonth && !underLogged.active && year < 2027
    ? 'If spend stays near the average, leftover stays about HK$42,000 to HK$44,000. HK$5,000 of that is planned enjoyment, not extra room.'
    : null;

  return {
    timezone: 'Asia/Hong_Kong',
    month: {
      year,
      month,
      key: monthKey(year, month),
      label: MONTH_LABELS[month - 1],
      title: `${MONTH_LABELS[month - 1]} spending`,
      day,
      daysInMonth: days,
      current: isCurrent,
    },
    asOf: now.toISOString(),
    personalSpent,
    wellOnSpent,
    wellOnHalf,
    hisSpend,
    everydayTarget,
    everydayTargetLabel: target.label,
    planCap: PLAN_CAP,
    remainingAverage,
    remainingPlan,
    remainingCaption,
    planCaption,
    projectedMonthEnd,
    evenPaceAverage,
    evenPaceCap,
    discretionaryHis,
    taxMonth: tax.taxMonth,
    taxAmount: tax.taxAmount,
    taxSource: tax.taxSource,
    status,
    underLogged,
    offerRoom,
    headline,
    subhead,
    lines: [
      { id: 'personal', label: 'Personal spent', amount: personalSpent },
      { id: 'wellOn', label: 'Well On spent', amount: wellOnSpent },
      { id: 'half', label: 'Well On half', amount: wellOnHalf },
      { id: 'combined', label: 'Combined', amount: hisSpend },
    ],
    envelopes,
    yearly: yearlyWatch,
    recent: recent.slice(0, 40),
    notices: {
      personalEmpty: personalCount === 0,
      wellOnEmpty: wellCount === 0,
      personalEmptyText: 'No personal entries yet this month.',
      wellOnEmptyText: 'No Well On entries yet this month.',
      skipped,
    },
    contextNote,
    outsideNote: 'Family support, the mortgage, insurance, and MPF are not in these form totals.',
    forms: {
      personal: PERSONAL_FORM,
      wellOn: WELLON_FORM,
    },
  };
}
