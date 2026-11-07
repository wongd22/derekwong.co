# Spending dashboard

Private month check for Derek Wong at `/spending` on derekwong.co. It answers two questions, in Asia/Hong_Kong, for one calendar month:

1. Can I still make a small spend, such as coffee or an extra meal?
2. When should I cut extras so I keep the spending average and still fund the plan?

Logging stays on the existing Google Forms. This page does not add expenses, and it is not a chart gallery.

- Personal form: https://forms.gle/KQuSFhzTKtXgf98k8
- Well On form: https://forms.gle/5J55inBAGSwi6wrD8

## Frontend architecture

The site is a Vite and React single page app. `src/App.jsx` mounts `src/pages/Spending.jsx` at `/spending`, the same way Place Calculator is mounted at `/place`. `vercel.json` rewrites `/spending` to `index.html` so a refresh still opens the app. `/api` is not rewritten.

Styles live in `src/styles/spending.css` and apply only under `.spending-shell`, plus a `body:has(.spending-shell)` rule so the black site background does not show through while this route is open. Other pages keep their own look. The typeface is Manrope, loaded from `@fontsource/manrope` only by this page. Copy on the page avoids hyphen characters. Motion is limited to transform and opacity, and it turns off under `prefers-reduced-motion`.

The page is a listing plus a spend map: a slim icon rail, a month title, filter pills, search, sort, list or grid cards, and a right hand panel of amount pins. The pins are envelopes and entries, not a city map. A homepage card can open `/spending`. It does not show amounts.

### State and the gate

On open the page calls `GET /api/spending/session`.

- If the gate password is missing, it shows a setup message and no totals.
- If the visitor has no session cookie, it shows a password form and no totals.
- After `POST /api/spending/login`, it calls `GET /api/spending/summary?fresh=1`.
- `POST /api/spending/logout` clears the cookie.

The browser keeps filter, search, sort, and list or grid state. Those only hide cards and pins. The status line always uses the full month. Changing the month asks the API again. Refresh asks again with `fresh=1`, so a form submitted a minute earlier can show up. Amounts are not stored in `localStorage`.

If the ledgers are not connected, the signed in page says so and does not invent totals. `SPENDING_FIXTURE=1` is a local layout switch only. Production ignores it. A fixture response is labeled sample data.

## Data layer

The browser never talks to Google. `api/spending/*.js` are Vercel Node functions. They share `server/spending/handler.js`. Local `npm run dev` serves the same handlers through the Vite plugin in `vite.config.js`.

### Sheets

Read the ledgers directly. Do not use the Expenses tab `From Well On Expense`. That import is capped and drops remarks.

| Ledger | Spreadsheet | Tab | Columns |
| --- | --- | --- | --- |
| Personal | `1svycG2C2mr6Rr7CCndBkVHG33BY2Gme49farwFbzc4I` | `Expense data` | Timestamp, Category, Amount, Remarks |
| Well On | `1xxg6TsEhj69e7Y2fNxPhz47E_qstISJEwDu6Zugn7JI` | `WellOnExpense` | Timestamp, Category, Amount, Pay by, Remarks |
| Tax check | same Expenses workbook | `2026` | Month headers `2026-Jan` through `2026-Dec` |

`2026 Monthly allocation` is not read. Its written envelopes are composition labels in code, not the live cap.

Timestamps look like `25/10/2026 11:48:49` (day/month/year) and are read as Hong Kong wall time. `11/05/2026` is 11 May, not 5 November. A row with an unreadable date or amount is skipped and counted. A month with no rows reports 0 and says there are no entries yet.

### his_spend

```
his_spend = personal Amount this calendar month + 0.5 × all Well On Amount this calendar month
```

Pay by is identification on the recent list only. Well On is not split by who paid. Trip stays inside this total. The page shows personal spent, Well On spent, Well On half, and combined as separate lines.

Everyday target for a 2026 month, including December: **12227**. That is the mean combined his_spend of completed months January through October 2026 (personal 63610.90 / 10 = 6361, Well On half 58662.14 / 10 = 5866). After December 2026 the target becomes the mean of the previous 12 calendar months, including months with no rows as zero. Until then the page keeps 12227 even if it can see later rows.

Plan safe cap for a normal month: **14412** = 77580 − 21667.54 − 1500 − 40000. Do not use Looker's 6000 personal scorecard, the 17000 allocation total, or 123537 / 12.

```
remaining_average = max(0, everyday target − his_spend)
remaining_plan = max(0, 14412 − his_spend)
projected_month_end = his_spend × (days in month / day of month)
```

For a past month, day of month is the last day, so the projection is the actual total. Remaining never goes below zero. In a tax month both remaining figures are withheld rather than offered as room.

Even pace is the target and the cap times day / days in the month. On 7 November 2026 that is about 2853 of the average and about 3363 of the cap.

### Status

Normal month, in this order:

- **Stop discretionary** when the projected month end is above 14412, or month to date is already above the everyday target and discretionary categories cover that overage. No more coffee, extra dining, entertainment, impulse clothes, or extra taxis. Necessities continue.
- **Tighten extras** when the projection is above the everyday target and still at or under 14412. Cut coffee, extra meals, and nonessential taxis first.
- **On track** otherwise. Small spends are fine.

Projected month end at or under the everyday target is the same test as month to date at or under even pace.

Discretionary levers: personal Meal, Entertainment, Book, Clothes, and Trip; Well On meals, taxis, entertainment, clothes, appliances, and listed one offs. Unknown Well On text counts as discretionary and is still listed. Personal Transportation stays mixed, because ordinary commuting is not a cut. Family and Karen are not auto cut. Near fixed bills (management fee, electricity, rates `差餉`, water, gas, house service, HKT, parking, Townplace) and paceable grocery, cat care, and `洗冷氣` are not coffee levers. `deposit` and buy house fee are ignored for the pace warning but still sit inside his_spend. `lunch deposit` stays discretionary.

Cut order when the month is amber or red: personal Meal, then personal Entertainment, then Well On Meal / Entertainment / extra Taxi or Uber, then clothes and similar one offs.

### December

December 2026 is a protect cash tax month when the `2026` tab has a tax or big money amount in `2026-Dec`, or when that tab cannot be read. The known bill is 72562. The page does not offer 12227 or 14412 of room. If the tab is read and the December tax cell is blank, the page does not invent one. A later December is a tax month only when that year's December column actually has a tax or big money amount. Household bills still count.

### Under logging

Well On looks thin when, in the current month, the latest Well On timestamp is more than four days old, or from day 5 onward the half is under half of the pro rata share of about 5866 (and also under half of 5866). A finished month is thin when its half is under half of 5866. The face value remaining can still be shown, but it is labeled as not room to spend, and it is not treated as a green leftover. The 7 Nov 2026 readout (personal 1181, Well On half 82.50, latest logging stalled after late October) is the reference case.

### Envelopes and the yearly watch

Written monthly amounts are composition only. They are not the cap. They happen to add to 17000, which would break the 40000 surplus policy.

| Envelope | Written month | What goes in |
| --- | --- | --- |
| Normal | 3000 | Meal and Transportation |
| What I love | 2000 | Entertainment and Book |
| Special | 1000 | Family and clothes, with Karen included here and also shown alone |
| Trip | 4000 | Trip. Better watched as 48000 a year |
| Well On half | 7000 | Half of every Well On amount |
| Karen | none | Own line |

Yearly watches, not the live monthly cap: combined 156000, my expense 72000, trip 48000, meal and transport 36000, what I love 24000, family clothes and Karen 12000. The page lists a watch once it is at 85 percent or over.

Enjoyment of 5000 is context only. If spend stays near the 2026 average, leftover stays about 42000 to 44000, and 5000 of that is planned enjoyment, not extra coffee budget. Family support, the mortgage, insurance, and MPF are outside the forms. Scorelab, Clinical Owl, and `/shopping` are not spend.

### What the client receives

After the cookie is valid, the API returns aggregates, envelope cards, yearly watches, status copy, and up to 40 recent rows for the selected month (date, source, category, amount, his half, payer, a short remark). It does not return the service account, the gate password, or the rest of the ledger.

Sheet reads use a short server cache of about 20 seconds. `fresh=1` bypasses it.

### Environment variables

Set these on Vercel for Production and Preview. Do not commit them. Do not put them in any `VITE_` variable.

| Variable | Required | Purpose |
| --- | --- | --- |
| `SPENDING_GATE_PASSWORD` | Yes | Shared gate password. Compared on the server. |
| `SPENDING_SESSION_SECRET` | No | HMAC secret for the httpOnly cookie. Falls back to the gate password. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | One of these | Full service account JSON, raw or base64. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | One of these | Email plus private key. Newlines may be escaped as `\n`. |

Leave `SPENDING_FIXTURE` unset on Vercel. It is refused when `VERCEL_ENV=production`.

Share both spreadsheets with the service account email as a Viewer:

- https://docs.google.com/spreadsheets/d/1svycG2C2mr6Rr7CCndBkVHG33BY2Gme49farwFbzc4I/edit
- https://docs.google.com/spreadsheets/d/1xxg6TsEhj69e7Y2fNxPhz47E_qstISJEwDu6Zugn7JI/edit

The cookie is `spending_session`, httpOnly, `SameSite=Lax`, path `/`, 14 days, and `Secure` on https. A wrong password returns 401 and no ledger. A missing session returns 401 from the summary route.

Local check with sample rows, still behind the password:

```
SPENDING_GATE_PASSWORD='choose-one' SPENDING_FIXTURE=1 npm run dev
```

`npm test` runs `test/spending.test.mjs` for the timestamp, the November readout, the payer rule, status boundaries, December, categories, and the locked API.
