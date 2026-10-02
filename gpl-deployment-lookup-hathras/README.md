# GPL Deployment Lookup — Hathras

Offline browser prototype built from the three supplied PDFs.

## Structure

- `index.html` — app entry point
- `css/styles.css` — responsive/mobile UI
- `js/data.js` — all PDF-derived deployment and ANI data
- `js/app.js` — search and rendering logic
- `source-pdfs/` — original supplied PDFs for reference
- `README.md` — project notes

## Source data

1. GPL Deployment PDF — Hathras: 8 pages. Populated deployment rows are S.L. 1–121; S.L. 122 is blank and S.L. 123–140 are blank. The table columns are preserved as supplied.
2. H/B H/H Kenwood NX3220 ANI PDF: 90 populated records.
3. H/B ST/Mob Kenwood NX 3720 ANI PDF: 105 populated records.

The GPL PDF contains entries with a location but no new ST/MOB set number, and some entries with no location name but an H/H equipment code. Those are kept as-is; the application displays `स्थान नाम PDF में उपलब्ध नहीं` when the source row has no location.

ANI records are linked to GPL deployment rows only when the exact set number appears in the GPL data. Unmatched ANI records remain searchable and explicitly show that a GPL deployment location was not found in the supplied deployment PDF.

## Important data handling

- No web/API/server dependency.
- No external JavaScript libraries.
- Case-insensitive search.
- Partial Set Number, ANI and place search.
- `सभी` searches Set Number, ANI and place together.
- OCR/source strings are not silently corrected. Examples such as `C411O641`, `C3C112487`, and source values like `I POWER` remain source-derived.
- Blank source cells are displayed as `—`.
