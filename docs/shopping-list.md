# Shopping list

Hobby list for Derek Wong at `/shopping` on [derekwong.co/shopping](https://www.derekwong.co/shopping). It exists so he can quickly save something he may buy later, and still find it.

Use it like a capture box. Type a name, press the add button, and leave. Come back when the purchase is real. Location, a product link, remarks, a photo, and tags are optional and can wait. The circle marks an item bought so the default view stays the things still open. A bought item stays stored until it is deleted.

This page does not record spending. There is no price, quantity, receipt, or date bought. Marking an item bought does not write a row to `/spending`, to either Google expense form, or to any ledger. `/spending` does not read this list. The homepage card is a door to the list. It shows no items and no counts.

## Frontend architecture

The site is a Vite and React single page app. `src/main.jsx` mounts `src/App.jsx` in `React.StrictMode`. `src/App.jsx` mounts `src/pages/Shopping.jsx` at `/shopping`, the same way Place Calculator is mounted at `/place` and the spending dashboard at `/spending`.

`vercel.json` rewrites `/shopping` to `/index.html`. A refresh or a pasted link still opens the app, and the client router then renders the list. The rewrite is that exact path. There is no `/api/shopping` route, and the spending dev middleware in `vite.config.js` ignores this page.

The homepage card lives in `src/pages/MyPage.jsx`: title "Shopping List", description "To Buy List", link `/shopping`. `src/components/ProjectCard.jsx` renders it as a normal `<a href>`, so opening it loads the document again. It does not use React Router's `<Link>`.

`MyPage` also declares its own `<Route path="/shopping">`. That route never runs. App matches `/shopping` first and renders `Shopping` itself, so `MyPage` is not mounted on this URL. The inner route is leftover. A later route change belongs in `src/App.jsx` and `vercel.json`.

### Layout and styles

There is no `shopping.css`. The page uses Tailwind classes on the components, plus the site body in `src/index.css`: Inter, black background, white text. It does not use Manrope or `src/styles/spending.css`, and it has no `body:has(...)` override.

The page is a black column, `max-w-3xl`, centered, with padding. The title is "Shopping List". Under it, three stacked panels share the same glass chrome: `bg-white/5`, `backdrop-blur-lg`, `rounded-xl`, `border-white/10`.

1. Add row. Placeholder "Add new item...". The button is an emerald-to-blue gradient with a plus icon.
2. Filter row. A filter icon, one toggle, then one chip per tag that exists on any item.
3. The list. One row per visible item.

A row shows a circle, a 48px thumbnail when `imageUrl` is set, the name, the location when it is non-empty, the tags, and then the actions: open the product link, edit, delete. A bought row is dimmed, and the name is struck through. The circle is filled emerald with a check once bought. Remarks are not on the row. They are only in the details drawer.

The drawer is a Headless UI `Dialog` from the right (`src/components/Shopping/ItemDetailsPanel.jsx`), title "Item Details". Fields, in order: Name, Location ("Where to buy?"), Image, Product URL, Remarks, Tags. The footer button is "Save Changes". The overlay and the X close it.

Icons are from `lucide-react`. Class toggling uses `clsx`.

### Components

| Piece | File | Role |
| --- | --- | --- |
| Page | `src/pages/Shopping.jsx` | Composes the list hook, the details hook, and the four visible components. |
| Add | `src/components/Shopping/AddItemForm.jsx` | Local input state. Submits the trimmed name. |
| Filters | `src/components/Shopping/FilterBar.jsx` | Bought toggle and tag chips. |
| List | `src/components/Shopping/ShoppingList.jsx` | Rows, empty copy, bought, link, edit, delete. |
| Drawer | `src/components/Shopping/ItemDetailsPanel.jsx` | Fields and the image block. Renders nothing until an item is selected. |
| Tags | `src/components/Shopping/TagList.jsx` | Chips on the item, suggestions, and the "Add a tag..." field. |
| List state | `src/hooks/useShoppingListManager.js` | Subscription, filters, add, delete, bought toggle. |
| Drawer state | `src/hooks/useItemDetailsManager.js` | Draft, tags, image upload, save. |
| Storage calls | `src/lib/firebase.js` | Realtime Database and Storage. The only module these hooks import. |

### Client state, refresh, and a later visit

The list on screen is React state filled by a Firebase `onValue` subscription. The effect subscribes on mount and unsubscribes on unmount. In development, StrictMode runs that effect twice. Production subscribes once per visit.

These values live only in memory:

- `showBoughtItems`, default `false`
- `selectedFilterTags`, default `[]`
- the open drawer, the selected item, and the unsaved draft
- the tag being renamed, the tag input, and the upload message

A refresh or a new visit drops all of that. The page subscribes again, the drawer is closed, bought items are hidden, and no tag chip is selected. Items are not written to `localStorage` or `sessionStorage`. Place Calculator and Trading Rituals use `localStorage` for their own keys. This page does not.

Until the first snapshot arrives, `items` is `[]`, so the list shows "No items found. Add some items to your shopping list!" The same sentence is used when the database is empty, when every remaining item is bought and the default filter hides them, and when the tag filter matches nothing. There is no loaded flag and no error banner.

Filters never write to Firebase. They only hide rows.

- Bought toggle. `false` keeps rows with `isBought` off the list. The button reads "To Buy". `true` shows every item, bought and not. The button reads "Show All". The label names the view that is on, not the view a click will turn on. Marking an item bought while "To Buy" is on removes that row from the visible list. The row is still stored.
- Tag chips. `allTags` is every distinct tag on every item, including bought items that are currently hidden. Chip order follows the newest-first item order, then first appearance. Selecting several tags keeps a row only when it has every selected tag. A chip whose only items are bought will show the empty sentence until "Show All" is on.

Two browsers stay in sync through the subscription. An open drawer does not. It keeps the draft from the moment the pencil was clicked.

## Data layer

The browser talks to Firebase directly. There is no shopping API, no Vercel function, no Google Sheet, and no database in this repo. The client config is in `.env` and is compiled into the production bundle.

| | |
| --- | --- |
| Project | `tobuy-ca0e7` |
| Realtime Database | `https://tobuy-ca0e7-default-rtdb.firebaseio.com` |
| Node | `shopping_list` |
| Storage bucket | `tobuy-ca0e7.firebasestorage.app` |
| Image path | `shopping_images/{itemId}/{fileName}` |
| Auth domain | `tobuy-ca0e7.firebaseapp.com` |

`initializeApp` runs when `src/lib/firebase.js` is imported. The page never signs anyone in. There is no password gate.

### Item shape

Each child of `shopping_list` is one item. The id the UI uses comes from the push key Firebase generates. The listener builds `{ id, ...value }`, so a child that itself stores an `id` field replaces the push key. The current client never writes `id`. Deletes and updates then use whatever survived that spread.

| Field | On create | Notes |
| --- | --- | --- |
| `name` | the typed text | Required by the add form. The only field the checked-in rules insist is present. |
| `location` | `''` | Free text. "Where to buy?" in the drawer. Shown under the name when non-empty. |
| `imageUrl` | `''` | Download URL, or empty. The row shows a thumbnail only when this is non-empty. |
| `url` | `''` | Stored as typed. The external-link icon renders an `<a href>` when it is non-empty, `target="_blank"`, `rel="noopener noreferrer"`. Nothing checks that it is http(s). |
| `remarks` | `''` | Drawer only. |
| `tags` | `[]` | String array in the client. |
| `isBought` | `false` | A reminder flag. Not a purchase. |
| `createdAt` | ISO time from `new Date().toISOString()` | Set in `addShoppingItem` only. Later edits do not change it. |

After every snapshot the client sorts by `createdAt`, newest first. If `createdAt` is missing or not a date, the comparison is `NaN` and that item's order is not defined. Editing an item does not move it, because `createdAt` is not part of the update.

Realtime Database stores a JavaScript array as children with keys `"0"`, `"1"`, and so on. The console shows that map. `snapshot.val()` turns it back into an array when every key is an integer and the highest key is less than twice the number of children. The app's own tag saves write a dense array, so the UI gets an array. The list then calls `.map` and `.includes` on it. A hand-edited or sparse `tags` map that fails that test comes back as a plain object, and those calls throw while rendering.

An empty array becomes an empty node, and an empty node is not stored. A create that sends `tags: []` comes back without a `tags` field. Saving a draft whose tags are `[]` removes `tags` the same way. The UI treats a missing field as no tags (`item.tags || []`). Empty strings and `isBought: false` are stored. `update()` is a partial write, so a field the save omits is left as it was.

### What each action writes

| Action | When it hits Firebase | Payload |
| --- | --- | --- |
| Add | Immediately, from the typed name. The input clears without waiting for the write. | `name`, empty location, image URL, url, and remarks, `tags: []`, `isBought: false`, `createdAt`. A blank name is ignored. |
| Bought circle | Immediately. | `{ isBought: !item.isBought }` only. |
| Delete | Immediately. No confirm. | If `imageUrl` is set, the Storage object is deleted first. Then the `shopping_list/{id}` child is removed. |
| Drawer text, link, remarks, tags | Only when "Save Changes" succeeds. Closing the drawer drops that draft. | `name`, `location`, `url`, `remarks`, `tags`, and `isBought`. `imageUrl` is included only when the draft's URL is non-empty. |
| Upload or the red X on the photo | Immediately, not on Save. | See Images. |

Add, toggle, delete, and save failures are `console.error` only. The add box is already empty if the add then fails. The drawer stays open if save fails. There is no retry.

"Save Changes" sends the `isBought` value copied into the draft when the drawer opened. The drawer has no bought control. The circle on the row is a separate write. Saving the drawer afterwards writes the old flag back.

Tag edits are local until save. Enter on a chip renames that tag on this item only. Blur or Escape cancels the rename. Suggestions are the tags currently stored on any item, minus tags already on the draft. They come from the last snapshot, not from the draft, so a tag removed in the draft shows up as a suggestion until save. Adding a tag dedupes it on this item. Renaming onto an existing tag can leave a duplicate. A rename does not update other items.

### Images

`uploadImage` stores the file at `shopping_images/{itemId}/{file.name}` and returns `getDownloadURL`. The object name is the browser's file name, unsanitized. A second file with the same name on the same item overwrites that object.

The picker uses `accept="image/*"`. The handler then allows only `image/jpeg`, `image/png`, `image/gif`, and `image/webp`, and only when `file.size` is not greater than 5MB. The helper text matches that list. A rejected file sets the message under the picker and does not upload.

Replacing a photo deletes the previous Storage object first, then uploads, then `update`s `imageUrl`. The red X deletes the object, clears the draft URL, then `update`s `{ imageUrl: '' }`. Save will not clear `imageUrl` by itself, because it omits an empty URL.

`deleteImage` passes the stored download URL to `ref(storage, imageUrl)`. In firebase-js-sdk 10, `ref` sends an `http(s)` string through `refFromURL`, and the download token in the query string is not part of the object path. A normal `getDownloadURL` value can be deleted that way. If that delete throws, the item delete stops and the row stays. A replacement upload stops too. The drawer shows "Failed to delete image" or "Failed to upload image. Please try again." A delete that removes the object and then fails the database `update` leaves `imageUrl` pointing at an object that is already gone.

### Rules checked into the repo

This repo does not deploy Firebase rules. There is no `firebase.json` and no deploy script. The console can differ from these files. The client will follow the console, not the file, when they disagree.

`database.rules.json` is the Realtime Database rules file. For `shopping_list` it sets `.read` and `.write` to `true`, then validates each child:

- `name` must be present, a string, length 1 to 100
- `createdAt`, when present, must be a string
- `location`, when present, must be a string of length at most 200
- `imageUrl`, `url`, and `remarks`, when present, must be strings of length at most 1000
- `isBought`, when present, must be a boolean
- `tags` uses `!newData.exists() || newData.val() == null || true`, which does not constrain the value
- there is no `$other` rule, so extra fields are allowed

The client enforces none of those lengths. A name of 101 characters is accepted in the form. If the checked-in name rule is what production runs, the write is rejected, the list does not gain the row, and the only signal is the console. The add input is already clear.

The same file has a `trades` tree with auth checks. That is not the shopping list. `src/lib/firebase.js` also exports trade helpers aimed at a flat `trades` node. Nothing in the current app calls them. Trading Rituals stores its own state in `localStorage`. Leave those helpers alone when changing the list. Their shape does not match the `trades/$userId` rules.

`storage.rules` and `firebase.rules` are both Cloud Storage rules, despite the second name. Neither is the database. For `shopping_images/{itemId}/{fileName}` they match: public read, write when the content type matches `image/.*` and the size is strictly under 5MB, delete when the object exists. `storage.rules` also covers `trade_images`. `firebase.rules` does not. A file of exactly 5MB passes the client check and fails this storage rule.

### Environment variables

Vite inlines these at build time. They are client config, not a server secret. The values already live in `.env`, and that file is tracked. The production bundle is built with this same project, database URL, and `shopping_list` path. Do not copy the key into a doc or a second env file. Do not put them behind a `VITE_` name that a server route expects to stay private. Anyone who can load the page can see them in the bundle.

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Web API key passed to `initializeApp`. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain. The shopping page does not sign in. |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL above. |
| `VITE_FIREBASE_PROJECT_ID` | `tobuy-ca0e7`. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket above. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender id. Messaging is unused. |
| `VITE_FIREBASE_APP_ID` | App id passed to `initializeApp`. |

A missing config fails at import, before the page can show a useful empty state. `npm test` runs `test/spending.test.mjs` only. Nothing in the test script covers this list.

## What a later change should know

The capture path is the product. Add with a name, see it at the top, find it again after a refresh. Bought means "hide this from the default view," not "I spent money." A change that adds prices, posts to `/spending`, or turns the circle into a ledger row is a different app.

Coupling and traps:

- Shopping imports `src/lib/firebase.js`, the file. A directory `src/lib/firebase/` sits beside it and is not on this path. Node resolves the file first. That directory's `config.js` calls `initializeApp` again, and its `index.js` re-exports `./models/trade`, `user`, `account`, and `note`, which are not in the repo. Importing the directory would throw. Importing both initializers would throw a duplicate-app error.
- `src/lib/firebase.js` is also where the unused trade helpers live. A cleanup of "dead Firebase code" can break the list if it deletes `subscribeToShoppingList`, `addShoppingItem`, `updateShoppingItem`, `deleteShoppingItem`, `uploadImage`, or `deleteImage`.
- Routes are easy to edit in the wrong file. `MyPage`'s `/shopping` route is dead. The live route is `src/App.jsx`, and a refresh depends on the `vercel.json` rewrite.
- The list subscription has no error callback. A rules rejection looks like an empty list, or like a row that never appears. Do not treat the empty sentence as proof that `shopping_list` has no children until a snapshot has arrived.
- The open drawer is a stale copy. A snapshot that arrives while it is open does not refresh the draft. Save writes that copy over `name`, `location`, `url`, `remarks`, `tags`, and `isBought`, and over `imageUrl` when the draft still has one. The bought circle and the photo X are live writes. Saving afterwards can undo a circle toggle made while the drawer was open.
- Photo success and text success are different moments. The photo is already in Storage and on the item before Save. Text, the link, remarks, and tags are not. Closing the drawer keeps the photo and drops the rest.
- Delete is unconfirmed, and the image delete is in front of the row delete. A Storage failure blocks the row delete. A database failure after a successful object delete leaves a broken `imageUrl`.
- Add reports success by clearing the box, before Firebase answers.
- `createdAt` is the device clock, not a server timestamp. Sort uses that string. Two devices with skewed clocks can order a new item differently.
- Tag chips and the bought toggle reset on every visit. Someone who filters, refreshes, and thinks the item was deleted is looking at the default "To Buy" view.
- Security is the rules, not the UI. The checked-in database rules are world read and world write, with the field checks above. The checked-in storage rules are public read and an image-size write. This repo does not deploy them. Before tightening or relying on them, read the Firebase console for `tobuy-ca0e7`. The page will not grow a login by itself.
- There is no offline persistence call. A refresh needs the network to fill the list. The in-memory SDK cache does not survive the reload.
