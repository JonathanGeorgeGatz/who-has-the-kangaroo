# Enclosure Check-Out Studio 🐾

A QR-driven animal check-out / check-in system built entirely on **Google Sheets +
Google Apps Script** — no paid services, no external database. Staff scan a poster,
tap twice, and the master dashboard always knows **who is out, with whom, and for
how long**.

## Why a web app instead of Google Forms

Plain Google Forms cannot do the things this system needs most:

| Requirement | Google Forms | This web app |
|---|---|---|
| Remember the person's device | ❌ impossible | ✅ `localStorage` — greets them by name |
| Hide animals that are already out | ❌ static lists | ✅ list rebuilt live from the Log |
| Auto-know which animal to check in | ❌ impossible | ✅ looked up from the open outing |
| Playmate list limited to overlapping animals | ❌ impossible | ✅ computed from the Log intervals |
| Several animals + equipment in one go | ❌ one row per response | ✅ one tap per item, one submit |

The web app is served free by Google Apps Script from the same Google account,
writes to the same Google Sheet, and opens instantly from a QR code — it *is* the
form, just smarter and prettier.

## What's inside

```
apps-script/
  Code.gs        All server logic + one-time setup() that builds the styled spreadsheet
  Styles.html    Shared design system (Fraunces + Inter, forest/cream/gold palette)
  CheckOut.html  QR page 1 — pick name (remembered), tap every animal and every
                 piece of equipment (Audio / Vehicles / Equipment) you're taking
  CheckIn.html   QR page 2 — everything you have out is pre-selected, activity
                 checklist, overlap-aware playmate picker, comments
  Board.html     Live wall dashboard — ticking timers, Equipment view,
                 "Daily Animals List" button, refreshes itself
  QR.html        Printable poster pair with generated QR codes
tools/
  build-previews.py  Renders previews/ with google.script.run mocked for browser testing
```

## The spreadsheet (built for you by `setup()`)

- **Dashboard** — title band, stat tiles (out now · today · month · year · avg
  outing), a live *Out Right Now* table (animals and equipment) with elapsed times
  that are green under 6 h, amber from 6 h and red from 8 h, a *Staff Spotlight*
  dropdown showing any person's full outing history with dates/durations/comments,
  and monthly leaderboards (animals only).
- **Log** — one row per animal or item per outing; open rows glow gold until
  checked in. *Kind* says Animal or Equipment; *Batch* ties together everything
  that went out in one submission.
- **Animals** — the roster: Animal · Species · Class (dropdown: Mammals / Birds / Reptiles /
  Amphibians / Invertebrates / Other; “Aves” etc. are understood) · **Emoji** (dropdown, or paste
  any emoji; blank = chosen from species/class) · Notes. Status / who-has-them / since-when fill
  themselves in. Type a new row and it appears on the forms immediately.
- **Equipment** — Item · Category (Audio / Vehicles / Equipment) · **Emoji** · Notes; same live
  status columns.
- **People** — the roster of staff & volunteers; untick *Active* to hide someone.
- **Read Me** — in-sheet crib notes for whoever administers it.

## Setup (about 10 minutes)

1. Go to **script.new** (while signed into the org's Google account).
   Name the project, then recreate the six files from `apps-script/`:
   `Code.gs` replaces the default `Code.gs`; add the five HTML files via
   **＋ ▸ HTML** (names must match exactly, without `.html`).
2. In the editor select the `setup` function and **Run** it. Authorize when asked.
   The execution log prints the URL of your new spreadsheet.
3. **Deploy ▸ New deployment ▸ Web app** → *Execute as: Me* · *Who has access:
   Anyone with the link* → **Deploy**. Copy the web app URL.
4. Open `…/exec?page=qr`, hit **Print**, laminate the two posters, mount them by
   the enclosures.
5. In the spreadsheet: **File ▸ Settings** → set your **time zone** and
   **Calculation → "On change and every minute"** (makes the dashboard's elapsed
   column tick). Set the same time zone in Apps Script **Project Settings**.
6. Replace the sample animals and people with the real roster. Done.

For the always-on display, open `…/exec?page=board` on a wall iPad or TV browser —
it ticks every second and refreshes itself twice a minute.

## Everyday behaviour

- **Check-out**: scan → your name is pre-selected (after your first visit) → tap
  every animal you're taking (grouped by class and species, already-out animals
  hidden, searchable) → tap any equipment (Audio / Vehicles / Equipment) → *Check
  out N animals + M items*. A race-condition lock means two people can never take
  the same animal or item; each gets its own Log row so they can come back
  separately.
- **Check-in**: scan → recognized → everything you have out is already selected
  (un-pick anything you're keeping, or add a colleague's) → tap what the animals
  did → if *Socialized* is picked, choose playmates from **only the animals that
  were out during the same window** → comment → *Finished*. Durations are computed
  and logged per item.
- **Timers** everywhere: green under 6 hours, amber from 6, red from 8.

## Notes

- "Device memory" is per-browser `localStorage` — on a shared iPad everyone will see
  the last user's name with a one-tap **Not you?** switch, which is the honest limit
  of device recognition without individual logins.
- Re-running `setup()` is safe: it rebuilds structure and styling but never touches
  logged data.
- Admin routes (token-gated): `?page=rebuild` re-runs `setup()`, `?page=peek` returns a JSON
  smoke test, `?page=addanimal&name=&species=&class=&emoji=&notes=` and
  `?page=addgear&name=&category=&emoji=&notes=` append a roster row if the name is new.
