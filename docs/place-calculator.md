# Place Calculator

Place Calculator is the scorekeeper at `/place` on Derek Wong’s site. People at the same table add players, type a score for each of them, submit the round, and read a running total. The whole feature is one React page. It has no server, account, or shared game room. Submitted games live in `localStorage` on that browser.

This note describes the behavior in the repository as of November 2026. The source of truth is `src/pages/Place.jsx`. The homepage card calls the same feature “Place Calculator” and describes it as “Easily calculate PLACE”. The code does not define how a raw PLACE score is earned in the card game. It only turns the numbers someone types into pairwise results.

## Who it is for

The page is for a small group sharing one phone or laptop during a game. A later editor of this repo is the other reader: routing, storage, and the scoring rule are easy to break because they sit in the same component and nothing tests them.

It is a pass-the-device tool. Opening `/place` on two browsers does not join those browsers into one game.

## How to open it

### Production

The public page is [https://www.derekwong.co/place](https://www.derekwong.co/place).

The site is a Vite single-page app. `vercel.json` rewrites `/place` to `/index.html`, and `public/_redirects` contains a host fallback (`/* /index.html 200`). Either one lets a direct visit or a refresh on `/place` boot the client router. The document title stays “Derek Wong”; the visible title is the heading inside the page.

From the homepage, the Place Calculator card is a normal link (`src/components/ProjectCard.jsx` renders an `<a href="/place">`). That loads the SPA at `/place`. The calculator itself has no link back to the homepage. Use the browser back button or go to `/`.

### Locally

From the repository root, with Node and npm installed:

```bash
npm install
npm run dev
```

Vite serves the app on port 5173 unless that port is taken. Open [http://localhost:5173/place](http://localhost:5173/place). The homepage at [http://localhost:5173/](http://localhost:5173/) links to the same route.

`npm run build` writes a static bundle to `dist/`. `npm run preview` serves that bundle. There is no separate Place build, environment variable, or backend process. A committed `dist/` directory may exist in the repo; read `src/pages/Place.jsx` when the two disagree.

`npm run dev` starts the whole site, including Shopping and Trading Rituals. Place does not need Firebase or any key from `.env` to function.

## User flows

A fresh browser, or a finished **New Game**, starts with two players named “Player A” and “Player B”. Names and the roster are editable before the first round.

1. **Name the players.** Each row has a text field bound to that player’s name. The name updates on every keystroke and is written to `localStorage` immediately.
2. **Add or remove people.** The plus control appends the next free letter from A–Z, named `Player <letter>`. The minus control on a row removes that player. Removal is refused, with an alert, when only two players remain. Adding a 27th player does nothing and shows no message.
3. **Enter a round.** Each player has a number field. **Submit Round** requires every current player to have a value `isNaN` accepts. Empty fields are rejected. A valid submit appends a round, then clears the number fields. Names stay.
4. **Read the total.** Cumulative Results lists each current player and the sum of their stored round results. Positive numbers render green with a leading `+`. Negative numbers render red. Zero renders in slate with no sign.
5. **Read history.** Rounds History is a table, newest round first. Each row shows the round number, every current player’s raw score, and every current player’s signed result. A player who was not in that round’s snapshot shows an en dash (`–`).
6. **Undo.** **Undo** asks for confirmation, then drops the last submitted round. The number fields for the round being typed are left as they are. With no rounds, an alert says there is nothing to undo. Only the latest round can be undone. Older rounds cannot be edited.
7. **New Game.** **New Game** asks for confirmation, then replaces the roster with Player A and Player B, clears every round, and clears the number fields. Custom names are discarded. Cancel leaves the saved game in place.

Pressing Enter in a score field does not submit. The inputs are not inside a form. Submission is the **Submit Round** button only.

There is no ranking sort, no per-round edit, no export, and no “who is the winner” treatment beyond the signed totals.

## Frontend architecture

### Files that participate

| Path | What it does for Place |
| --- | --- |
| `src/pages/Place.jsx` | The page. State, scoring, persistence, and markup live here. The default export is the function `PlayerCalculator`. |
| `src/App.jsx` | The router that actually mounts the page: `<Route path="/place" element={<Place />} />`. |
| `src/pages/MyPage.jsx` | Homepage project list. Also imports Place and declares another `/place` route. That inner route does not run; see Routing. |
| `src/components/ProjectCard.jsx` | Renders the homepage card link. |
| `src/main.jsx` | Renders `App` inside `React.StrictMode` and loads `src/index.css`. |
| `src/index.css` | Tailwind layers, the Inter font, and the default black body. |
| `index.html` | Document shell, viewport, title. |
| `vercel.json` | Rewrite so `/place` returns the SPA. |
| `public/_redirects` | Static-host fallback to `index.html`. |

Place does not import Firebase, `src/lib/utils.ts`, `src/styles/globals.css`, or any Shopping component. `globals.css` is not imported by the app at all. The shadcn-style color tokens in `tailwind.config.js` are unused by this page.

Dependencies the page touches directly are React 18, `react-router-dom` (only through `App`), and three `lucide-react` icons: `PlusCircle`, `MinusCircle`, `Undo`, `RotateCcw`.

### Routing

`src/main.jsx` mounts `App`. `App` creates one `BrowserRouter` and four sibling routes: `/`, `/shopping`, `/place`, and `/trading-rituals`.

`path="/"` renders `MyPage`. In React Router 6 that path matches only `/`, so visiting `/place` renders `Place` from `App` and does not render `MyPage`. Place therefore does not inherit the homepage’s black wrapper. It paints its own full-viewport gradient (`min-h-screen`).

`MyPage` contains a second `<Routes>` block with the same paths, including `/place`. Those child routes mount only when `MyPage` is on screen, which is the homepage. They are leftover registrations. The homepage card copy in `MyPage` is what the homepage shows; the calculator screen itself comes from `App.jsx`. A future layout change should delete one of the two route registrations so the next reader has a single place to look.

The homepage card uses a full document navigation (`<a href>`), not React Router’s `<Link>`. The result is still the Place page, after a reload.

### Component and state

`PlayerCalculator` is a single function component. Nothing is split into hooks, presentational children, or a scoring module. At the current size (one screen, three pieces of state) that is readable. The cost is that the scoring rule cannot be exercised without rendering the page, and storage failures share a fate with the view.

State:

| State | Type | Role |
| --- | --- | --- |
| `players` | `{ id: string, name: string }[]` | Roster, in display order. `id` is a single letter `A`–`Z`. `name` is free text. |
| `rounds` | round objects, oldest first | Submitted history. The table reverses this array for display. |
| `currentScores` | `Record<id, string>` | The round being typed. Values stay strings until submit. Not persisted. |

Derived during render, not stored: `cumulativeResults`, from `calculateCumulativeResults()`.

Updates are local `useState` setters. There is no context, reducer, or query cache. `React.StrictMode` in development runs the mount effect twice; the storage write is the same payload both times, so it does not duplicate rounds.

### Styling

Every visual decision is a Tailwind class on the elements in `Place.jsx`. There is no CSS module and no Place-specific stylesheet.

The page background is `bg-gradient-to-br from-blue-300 via-purple-400 to-pink-400`. Cards are translucent white (`bg-white/40` or `bg-white/30`) with `backdrop-blur`, a light border, and a large radius. Type is Inter, from `index.css`, requested again with `font-sans` on the page. Body text is `text-slate-800` / `text-slate-700`. The page heading is white.

Below the `lg` breakpoint the input column and the history column stack. From `lg` up, the grid is five tracks: input and cumulative results span two, history spans three. The history table sets `min-w-[600px]` inside `overflow-x-auto`, so a phone scrolls the table sideways. Player rows in the input card are one column on the smallest screens and two from `sm`.

Positive results use `text-green-600`. Negative results use `text-red-600`. The sign character is also rendered, so the color is not the only signal.

## Data model and persistence

This is the data layer. There is no database, API, or auth step on this route. Shopping uses Firebase. Trading Rituals uses its own `localStorage` key, `ptr-state-v1`. Place uses neither.

### Stored shape

The key is `playerCalculatorGame` (`GAME_STATE_KEY` in `Place.jsx`). The value is JSON on the origin of the page (`https://www.derekwong.co` in production, `http://localhost:5173` in local dev). Another domain, browser profile, or device has its own copy.

```json
{
  "players": [
    { "id": "A", "name": "Player A" },
    { "id": "B", "name": "Ada" }
  ],
  "rounds": [
    {
      "roundNumber": 1,
      "scores": { "A": 10, "B": 7 },
      "differences": { "A": -3, "B": 3 }
    }
  ]
}
```

`scores` and `differences` are plain objects keyed by player id. `roundNumber` is assigned at submit as `previousLength + 1`. Undo removes the last array entry, so the next submit reuses that number. Numbers in `scores` are JavaScript numbers after `Number(...)`, not strings.

A `useEffect` depending on `[players, rounds]` rewrites the key after each commit that changes either one. Name edits persist as the user types. The effect also runs on first mount, so a first visit writes the default two-player game even if the user does nothing.

There is no `version` field. The only migration is the legacy player list described below.

### What is not stored

`currentScores` is memory only. A refresh, a closed tab, or a crash drops the numbers that have not been submitted. Names, roster, and submitted rounds come back.

Clearing site data for the origin deletes the game. Nothing else copies it.

### Load and migration

`players` and `rounds` each call `localStorage.getItem` and `JSON.parse` in their own `useState` initializer. Both reads are wrapped in `try/catch`.

If the saved `players` array starts with a string, each entry `p` becomes `{ id: p, name: "Player " + p }`. That is the shape written before names were editable (a letter list such as `["A","B","C","D"]`). Rounds from that era are kept as stored. Their score keys are those same letters, so they still line up after migration. The effect then saves the object form.

The current default, when nothing is saved or the player read throws, is Player A and Player B. An older build defaulted to A–D and **New Game** reset to A–D. Games already stored keep whatever roster they had.

### When storage is unusable or malformed

Reads that throw (invalid JSON, `localStorage` unavailable) fall back to the default roster and, for the rounds initializer, to `[]`.

The two initializers do not share a result. A payload whose `players` value throws and whose `rounds` array is still readable comes back as Player A and Player B plus the old rounds. The following effect saves that combination, which drops the previous roster.

If `rounds` is missing, `null`, or otherwise not an array, the rounds initializer stores that value. The first render calls `rounds.forEach` inside `calculateCumulativeResults` and throws. `main.jsx` has no error boundary. The page does not paint, and the app offers no way to clear the key. Removing `playerCalculatorGame` in developer tools is the recovery.

The write path is `localStorage.setItem` with no `try/catch`. A quota error or a browser that rejects storage writes (some private-mode implementations) becomes an uncaught effect error.

Saved records are not checked for duplicate ids, missing `scores`, or non-numeric differences. The UI assumes the shape above. Hand-edited storage can blank cells, collide React keys (`roundNumber` and `player.id`), or throw.

## Scoring rules

Lower typed scores produce higher signed results. That is the whole product rule encoded in the page. The implementation is `calculateRoundDifferences`, which runs once at submit and stores the output on the round. Later renders do not recalculate a round from its raw scores.

For player `i` among the `n` players on the roster at submit time, with typed scores `s`:

```text
difference(i) = Σ (s[j] − s[i])   for every j ≠ i
              = (Σ s[k]) − n × s[i]
```

The code writes the first form: `(s[i] − s[j]) * -1` added across opponents. The second form is the same quantity and is the quick way to check a result by hand.

Properties, for the roster that was present when the round was submitted:

- The signed results add up to zero.
- Two players reduce to “opponent’s score minus yours”.
- A player who ties every opponent gets 0.
- Each opponent is a separate comparison. Beating one person by 3 and another by 3 is `+6`, not a single pot of 3.
- Integer scores produce integer results. Fractional scores use ordinary JavaScript numbers. The UI does not round, so a binary floating-point remainder would display as-is.
- Negative typed scores are accepted. The identity still holds.

### Worked example

Three players, scores A = 10, B = 7, C = 4.

| Player | Comparisons | Stored difference |
| --- | --- | --- |
| A | (7 − 10) + (4 − 10) | −9 |
| B | (10 − 7) + (4 − 7) | 0 |
| C | (10 − 4) + (7 − 4) | +9 |

Check: total of scores is 21, and `21 − 3 × score` gives −9, 0, and +9. The three results sum to 0.

Cumulative Results adds `differences[playerId]` across rounds for ids still on the roster. A player with no matching key in a round contributes nothing for that round and stays at 0 until a later round includes them.

### What the snapshot includes

Each round stores both the raw scores and the differences, for the ids that existed at submit. Renaming a player does not touch those objects. The name is display-only; the id is the join key.

Changing the roster does not rewrite old snapshots.

- Removing a player hides their columns. Their `differences` entry stays inside the saved round. Everyone else’s stored numbers still include the comparison against the person who left, and the cumulative total simply stops adding the removed id. The numbers on screen no longer sum to zero.
- Adding a player leaves older rounds without that id. History shows `–` for the new columns. Their cumulative total starts at 0. Later submits include them.
- The id allocator hands out the first unused letter in `A…Z`, not a fresh id. Remove C and add someone: the new row is id `C` again. Cumulative Results and the history table then show the removed player’s scores and differences under the new name. Remove A while B and C remain, then add a player: the new person is id `A` and inherits A’s history, because `A` is the first free letter.

That reuse is a defect in the current id scheme. Names can change safely. Departures and arrivals cannot, because identity is a recycled letter and history is never recomputed.

**New Game** avoids the issue only by throwing the snapshots away.

### Input accepted on submit

`handleSubmitRound` builds a score map for the current ids and rejects the round when any value is `''` or `isNaN` reports it as non-numeric. Accepted values are passed through `Number` and stored.

In practice the fields are `type="number"`, so the browser supplies an empty string or a numeric string. `0`, decimals, and negatives pass the check. The page does not require integers. Whitespace that coerces to `0` would also pass `isNaN`, which matters if a value is ever set without the number input’s filtering.

The alert on failure is `Please enter valid numbers for all players.` Partial input is left in place.

## Edge cases and error handling

User-visible failures all go through `window.alert` or `window.confirm`:

| Action | Behavior |
| --- | --- |
| New Game | Confirm: “Are you sure you want to start a new game? This will erase your saved game.” Cancel keeps the game. |
| Undo with at least one round | Confirm: “Are you sure you want to undo the last round?” |
| Undo with zero rounds | Alert: “No rounds to undo.” |
| Remove below 2 players | Alert: `Minimum 2 players required`. The row stays. |
| Submit with a blank or non-numeric field | Alert, as above. |
| Add player when A–Z are all in use | No state change and no message. |
| Remove player | No confirm. The minus control deletes immediately. |
| Storage write throws | Uncaught. The page has no fallback UI. |
| `rounds` in storage is not an array | Render throws. The page stays blank until the key is deleted. |

Other boundaries that are silent or easy to miss:

- Duplicate display names are allowed. The id still separates them in storage; the table does not.
- An empty name is allowed and shows as a blank label.
- There is no maximum name length. A long name widens the history table, which already scrolls horizontally.
- Undo does not clear the in-progress number fields.
- Round numbers are not renumbered, and a middle round cannot be removed.
- With a corrupt empty roster, submit’s validation loop sees no fields and will append an empty round. The plus control is the supported way back to two players. The UI never builds an empty roster on its own.

## Accessibility

The page uses real `<button>`, `<input>`, `<header>`, `<main>`, and `<table>` elements, so the primary actions are in tab order and the browser’s default focus ring still applies. Tailwind on this page does not set `outline-none`.

Gaps relative to a page that is meant to be used quickly at a table:

- Add and Remove are icon-only. They set `title` (`Add Player`, `Remove Player`) and do not set `aria-label`. New Game and Undo have visible text as well as `title`.
- Name fields and score fields have no `<label>`, `aria-label`, or `aria-labelledby`. The score placeholder is the word “Score”. A screen reader does not get the player name as the field’s accessible name.
- `Place.jsx` contains no ARIA attributes at all.
- The history table has no `<caption>`. Header cells do not set `scope`. Raw scores and signed results are two groups of player-name headers; the second group appends ` +/-` to the name.
- Result color is paired with a plus or minus sign. Missing history cells use an en dash.
- Add and Remove icons are 28px and 24px. That is a small touch target for a control that deletes a player with no confirm.
- Errors and destructive confirms are native `alert` / `confirm` dialogs. They are modal and announced by the browser, and they sit outside the page’s visual design. There is no inline error, and no live region when the cumulative total changes.
- Card surfaces are white at 30% or 40% opacity over a bright gradient. Contrast therefore depends on which part of the gradient sits behind the text. The page does not lock a solid foreground/background pair, and the repo has no contrast check.
- `index.html` sets `lang="en"`. The route does not update `document.title`, so a browser tab or screen reader window title stays “Derek Wong” on this page and on the homepage.

## Testing

`package.json` has `dev`, `build`, and `preview`. There is no test script, no Place test file, no ESLint config, and no GitHub Actions workflow. Nothing in the repo locks the zero-sum identity, the legacy migration, undo, or the letter-reuse behavior.

`React.StrictMode` is on, which double-invokes the storage effect in development. That is not a test.

A manual pass that matches the code today:

1. Open `/place` in a private window. Confirm two default players and an empty history.
2. Rename them, submit a round of integers, refresh, and confirm names and the round survived while the empty inputs did not.
3. Check the worked example (10, 7, 4 → −9, 0, +9) and that the three cumulative numbers sum to 0.
4. Undo back to an empty history. Submit again and confirm the next round number is 1.
5. New Game, cancel, then confirm, and confirm the saved names are gone.
6. Add a third player after a scored round. Confirm older cells are `–` and the new cumulative value is 0. Remove that player and add again. Confirm the new “Player C” shows the previous C history. That last step is the bug, not the desired rule.
7. Try to remove down to one player and to submit a blank score. Both should alert and leave state unchanged.
8. Resize below `lg` and confirm the history table scrolls sideways rather than overflowing the card.

## How it sits in the rest of the site

Place is a route on the portfolio SPA (`package.json` name `portfolio-website`), not a package of its own. It shares the Vite config, Tailwind build, `index.html`, and the router in `App.jsx`. It does not share runtime state with other routes.

| Neighbor | Relationship |
| --- | --- |
| Homepage (`MyPage`) | Lists the card. Does not wrap the live Place screen. |
| Shopping | Separate route. Persists to Firebase Realtime Database and Storage. Place must not be described as using that stack. |
| Trading Rituals | Separate route. Persists to `localStorage` key `ptr-state-v1`. |
| `database.rules.json` | Shopping validation rules. No Place path. |

Coupling to watch when editing:

- The public path `/place` is repeated in `App.jsx`, `MyPage.jsx` (dead route plus the card `link`), and `vercel.json`. `public/_redirects` is a catch-all, so it does not name `/place`.
- The storage key `playerCalculatorGame` is an unversioned public contract for anyone who already has a saved game in production.
- The default export name `PlayerCalculator` and the file name `Place.jsx` differ. `App.jsx` and `MyPage.jsx` both import the default.

## Audit

Judged against a small client-only tool, not against a multiplayer service. Adding a backend is not required for the feature that exists. The gaps below are about correctness, recoverability, and how hard the page is to change safely.

### What is solid

- The scoring rule is one pure function of the roster and the numbers submitted. For a fixed roster it is deterministic and zero-sum, and the closed form `(sum of scores) − n × score` matches the nested loop.
- Each round stores raw scores and signed results together. Renames do not rewrite history. Refresh restores submitted play.
- Submit refuses a blank current roster, and the minimum roster size is enforced on remove.
- New Game and Undo ask before destroying data. Undo deletes only the last snapshot and keeps round numbers consistent with array length.
- Legacy letter-list saves are recognized and rewritten into `{ id, name }` without dropping rounds.
- History cell keys include the round number and the player id, so rows do not share keys the way the earliest version of the table did.
- The layout responds: stacked cards on a narrow screen, a five-column grid from `lg`, horizontal scroll for the table.
- Signed color is backed by an explicit `+` prefix, or by the minus sign that `String` gives a negative number.
- The feature’s boundary is honest in code: one component, one origin, one storage key, no unused network call on this route.

### What is fragile

- Player identity is the first free letter `A`–`Z`. Removing someone and adding someone else reattaches the old snapshots to the new person. This is the most serious behavioral bug, because the totals look authoritative and are wrong.
- Cumulative Results filters stored differences by the current roster and never recomputes them. After a removal, remaining totals still contain the departed player’s comparisons, and the on-screen sum is no longer zero. The page does not say that.
- Persistence and render trust the JSON. A non-array `rounds` value white-screens the route. A throwing `setItem` is uncaught. The player parser and the rounds parser can disagree and then overwrite the saved roster.
- In-progress scores die on refresh, with no indication that only submitted rounds are safe.
- The 26-player ceiling and several invalid states communicate through `alert`, or through silence.
- `MyPage` still imports Place and registers `/place`. It is unreachable behind `App`’s route, and it will mislead the next edit.
- Scoring, storage, and markup cannot be checked apart from each other. There is no test harness in the repo to add a case beside the component.
- Translucent cards over a saturated gradient leave contrast to chance. Icon-only controls and unlabeled inputs are the accessibility floor, not a finished pass.
- Native confirm dialogs and immediate removal from a 24px control make a mis-tap expensive, especially combined with id reuse: the “wrong” person can be deleted and the next add resurrects their points under a new name.

### What is missing

- A schema version and a validator that normalizes or discards bad saves instead of throwing during render.
- Stable ids that are not reused for the life of a saved game.
- An explicit product choice for mid-game roster changes: recompute every round from raw scores for the new roster, or freeze the roster until New Game. Today the page does a third thing (keep stale differences, hide some of them) and does not document it in the UI.
- Tests for the identity above, migration, undo, and the reuse bug.
- Accessible names on the score fields and the icon buttons, and an in-page error instead of `alert`.
- A route title and a way back to the homepage.
- Feedback at the player cap.
- Any automated check in CI. The site has no workflow files.

None of these require inventing accounts or a database. They are gaps in the client feature that is already shipping.

## Known limitations, bugs, and gaps

Recorded so they can be re-checked against the code, not as a backlog commitment.

1. **Recycled ids inherit history.** `addPlayer` uses the first letter in `ABCDEFGHIJKLMNOPQRSTUVWXYZ` that is not currently on the roster. Old `rounds[].scores` and `rounds[].differences` stay keyed by that letter. A new player with a recycled id displays the previous player’s points. Confirmed in `addPlayer`, `removePlayer`, and the table’s `round.scores[player.id]` lookup.
2. **Roster edits do not recompute totals.** `calculateCumulativeResults` sums stored `differences` for current ids only. It does not call `calculateRoundDifferences` again. Removing a player drops their total and leaves everyone else’s historical comparisons intact.
3. **A bad `rounds` value crashes the route.** The initializer returns `JSON.parse(saved).rounds` whenever parse succeeds, including `undefined`. Render assumes an array.
4. **Player load and round load fail independently.** A throw while reading `players` resets the roster to A and B and can still keep `rounds`, then the effect persists that pair.
5. **`localStorage.setItem` is unprotected.** Reads are in `try/catch`. The effect that saves is not.
6. **Unsubmitted numbers are discarded** on any remount. Only `{ players, rounds }` is written.
7. **The add control is silent at 26 players.**
8. **Removal does not confirm**, and it is the control most likely to be hit by accident.
9. **Duplicate `Routes` in `MyPage`.** The live mount is `App.jsx` only.
10. **No automated tests, lint, or CI** cover this page.
11. **Accessibility gaps** listed in the Accessibility section: unlabeled inputs, icon buttons without `aria-label`, native dialogs, no route title.
12. **No in-app explanation of the formula.** Players are expected to know that a lower raw score is better and that the result is the sum of gaps against each opponent.

Not bugs, and worth keeping straight: the feature is intentionally local; Firebase elsewhere on the site is not a half-finished Place backend; decimals and negative scores are accepted because nothing rejects them; history is newest-first while `roundNumber` stays chronological.

## Conventions for changing it

- Read and update this document in the same change as the scoring rule, the storage key, or the roster rules. The page has no other spec.
- Keep `calculateRoundDifferences` as the single definition of a round result. If mid-game add and remove should mean something else, change that function and the cumulative sum together, and decide whether old snapshots are recomputed or sealed.
- Do not recycle player ids. A new person needs an id that has never appeared in `rounds` for this saved game. Letters `A`–`Z` can stay as a display default, not as the identity.
- Treat `playerCalculatorGame` as data already stored on `https://www.derekwong.co`. A breaking shape needs a version field and a migration. Keep reading the legacy string-player list until that migration has been in production long enough to ignore, and even then prefer tolerating it.
- Guard both the read and the write. If `rounds` is not an array or a player has no string `id`, fall back to a safe game or skip the bad field. Do not let a render throw be the validator.
- Leave Place off Firebase unless the product actually grows shared games. A sync layer is a different feature. Do not import `src/lib/firebase.js` “for consistency” with Shopping.
- Register the route in `App.jsx`. Update the homepage card `link` and the `vercel.json` rewrite if the path changes. Remove or stop extending the duplicate `<Routes>` inside `MyPage`.
- Keep user-facing copy in the component until the file is split. The alerts and confirms listed above are the error API. Replacing them means replacing all of them, including the silent 26-player case.
- Styles for this page are Tailwind classes in `Place.jsx`. Match that if the edit is small. A second stylesheet is extra surface for one screen.
- The meaningful checks are the worked example, a two-player round, undo, New Game, refresh, legacy JSON, and “remove then add does not inherit points”. Add those as tests when a runner exists. Until then, run the manual list in Testing.

## Suggested improvements

Ordered by how much they change the trustworthiness of the totals and the odds of a blank page. All of them fit the current client-only design.

1. **Stop recycling ids, and define roster changes.** Give each added player an id that does not collide with saved rounds. Then choose one rule and make the UI match it: either recompute every stored round from raw scores for the players who were actually in that round, or lock the roster after the first submit until New Game. The current partial-sum behavior should not survive unlabeled.
2. **Validate the saved game before render.** Require `players` to be an array of `{ id, name }` and `rounds` to be an array. Catch `setItem`. A corrupt key should fall back to the default game or show a “saved game could not be read” state with a clear action, never a blank route.
3. **Put the pure rule in a function that tests can import.** Cover the worked example, the zero-sum, two players, negative numbers, legacy migration, undo’s effect on `roundNumber`, and the “removed id does not come back” case. The repo has no test runner yet; a small Node test of a plain function is enough to start. Avoid standing up the whole Vite app for this.
4. **Name the controls.** Associate each score input with the player name, give the icon buttons accessible names, and move the four alerts into text on the page. Ask before removing a player, or offer undo for removal.
5. **Tell the truth about persistence and the cap.** Keep the draft scores in the same storage object, or leave them volatile and say so near the button. Disable the plus control at 26 players and say why. Set `document.title` on `/place`. Add a text link back to `/`.
6. **Delete the unused routes inside `MyPage`** when the next routing edit happens, so Place has one mount.

Later, if the table game needs it: integer-only scores, a ranked sort of the cumulative list, and deleting a round other than the last one. Those are product additions. Items 1 and 2 are the ones that make the existing numbers reliable.
