import { parseTimestamp } from '../../shared/spending/parse.js';

function stamp(year, month, day, time = '12:00:00') {
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dd}/${mm}/${year} ${time}`;
}

function entry(source, when, category, amount, remarks, payer = null) {
  return {
    source,
    at: parseTimestamp(when),
    category,
    amount,
    payer,
    remarks,
  };
}

function history() {
  return [
    entry('personal', '03/03/2026 10:00:00', 'Family', 8000, 'Family support top up'),
    entry('personal', '04/03/2026 10:00:00', 'Clothes, shoes etc', 4000, 'Coat'),
    entry('personal', '05/03/2026 10:00:00', 'Karen', 4000, 'Gift'),
    entry('personal', '02/07/2026 10:00:00', 'Trip', 42000, 'Summer trip'),
    entry('wellOn', '25/10/2026 11:48:49', 'Grocery', 100, 'ParknShop', 'Derek'),
    entry('wellOn', '20/10/2026 19:02:11', 'Meal', 80, 'Dinner', 'Karen'),
  ];
}

/** November 2026 shape from the 7 Nov readout: personal 1,181 and Well On half 82.50. */
function novemberRows() {
  return [
    ...history(),
    entry('personal', '02/11/2026 08:12:00', 'Meal', 86, 'Coffee'),
    entry('personal', '03/11/2026 12:40:00', 'Meal', 114, 'Lunch'),
    entry('personal', '04/11/2026 18:05:00', 'Transportation', 32, 'MTR'),
    entry('personal', '05/11/2026 09:15:00', 'Transportation', 270, 'Taxi to a meeting'),
    entry('personal', '06/11/2026 20:10:00', 'Entertainment', 400, 'Film'),
    entry('personal', '06/11/2026 21:02:00', 'Book', 279, 'Novel'),
    entry('wellOn', '01/11/2026 10:00:00', 'Grocery', 100, 'ParknShop', 'Derek'),
    entry('wellOn', '01/11/2026 19:30:00', 'Meal', 65, 'Dinner', 'Karen'),
  ];
}

function monthRows(year, month, items) {
  return items.map((item) => entry(
    item.source,
    stamp(year, month, item.day, item.time),
    item.category,
    item.amount,
    item.remarks,
    item.payer,
  ));
}

export function buildFixture({ year, month, scenario = 'november' }) {
  const taxInfo = { read: true, foundHeader: true, amount: 72562 };
  if (scenario === 'tighten') {
    return {
      rows: monthRows(year, month, [
        { source: 'personal', day: 2, time: '09:00:00', category: 'Meal', amount: 2000, remarks: 'Dining out' },
        { source: 'personal', day: 3, time: '09:00:00', category: 'Transportation', amount: 400, remarks: 'MTR' },
        { source: 'wellOn', day: 6, time: '18:00:00', category: 'Meal', amount: 1400, remarks: 'Shared dinner', payer: 'Karen' },
      ]),
      skipped: 0,
      taxInfo,
    };
  }
  if (scenario === 'stop') {
    return {
      rows: monthRows(year, month, [
        { source: 'personal', day: 2, time: '09:00:00', category: 'Meal', amount: 8000, remarks: 'Many dinners' },
        { source: 'wellOn', day: 6, time: '18:00:00', category: 'Grocery', amount: 2000, remarks: 'ParknShop', payer: 'Derek' },
      ]),
      skipped: 0,
      taxInfo,
    };
  }
  if (scenario === 'tax') {
    return {
      rows: [
        ...novemberRows(),
        ...monthRows(year, month, [
          { source: 'wellOn', day: 3, time: '09:00:00', category: '管理費', amount: 1800, remarks: 'Management fee', payer: 'Derek' },
        ]),
      ],
      skipped: 0,
      taxInfo,
    };
  }
  return {
    rows: novemberRows(),
    skipped: 0,
    taxInfo,
  };
}
