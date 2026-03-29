## Data Source

The GSheet is the single source of truth for the Creative Library.
The Library is a structured, intelligent view on top of the sheet —
not a separate database.

SHEET STRUCTURE (expected columns):
- Creative Name
- Format (Static / Video / Influencer / Animated)
- Notion Link  ← trigger for crawl
- US Status / IN Status / AU Status / MEA Status
- Hook Type (populated by Lens, written back to sheet)
- Frame (populated by Lens, written back to sheet)
- Language
- Confidence
- Last Analysed (timestamp, written back by system)
- Notes

Any row with a Notion Link that has not yet been analysed
→ queued for crawl automatically.
Any row with a Notion Link whose "Last Analysed" timestamp
is older than 7 days → re-queued for crawl.

## Sync Behaviour (fully automatic)

ON TAB OPEN:
- Fetch latest sheet data via Google Sheets API
- Diff against last known state
- New rows → create Library cards + queue for Lens crawl
- Changed Notion links → re-queue for crawl
- Changed status columns → update card status
- Render Library with latest state
- Show: "Last updated: just now"

BACKGROUND POLLING:
- Every 10 minutes while the Library tab is open
- Same diff logic as above
- Silent — no UI interruption unless new creatives are found
- If new creatives found: subtle toast notification:
  "2 new creatives added from sheet — [View]"

STATUS WRITE-BACK:
When user changes market status on a card in the Library:
- Update card immediately (optimistic UI)
- Write change to GSheet within 5 seconds
- If write fails → revert card status + show error toast:
  "Couldn't update sheet. Check connection. [Retry]"

NO MANUAL SYNC BUTTON.
The Library always reflects the sheet. 
The sheet is where the team works — the Library reads it.

## Upload Drawer (revised)

The Upload Drawer now serves one purpose only:
adding a Notion link to a new row in the GSheet directly from 
within Godfather — for users who prefer not to open the sheet.

It is a shortcut to the sheet, not an alternative to it.

STEP 1 — Paste Notion Link
STEP 2 — Fill: Creative Name / Format / Markets designated
STEP 3 — [Add to Sheet]

This creates a new row in the GSheet with the provided data.
The Library's background sync picks it up within seconds 
and queues it for Lens crawl.

The drawer does NOT run the crawl itself —
crawl is always triggered by the sheet-polling loop,
keeping the flow consistent regardless of how the row was added.

## Crawl Trigger Logic

Crawl runs on ANY sheet row where:
- Notion Link column is populated
- AND either:
  a. "Last Analysed" is empty (never crawled)
  b. Notion Link has changed since last crawl
  c. Last Analysed > 7 days ago (refresh)

Crawl is the same 3–4 call sequence regardless of 
how the row was added (via drawer or directly in sheet).

Source of crawl data: Notion page → Drive links inside it.
Tags written back: Hook Type / Frame / Language / 
Confidence / Last Analysed → all written back to sheet columns.