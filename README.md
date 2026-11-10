# Timeline Atlas of Ancient Human Ancestry

Subtitle on the page: A hypothesis of human origins, migrations, and mixing of populations from David Reich's book "Who We Are and How We Got Here".

A single-page interactive atlas for reading David Reich's *Who We Are and How We Got Here*.
A time slider runs from 300,000 years ago to the present. It shows ice sheets, sea level and
exposed land, population ranges, migration routes, mixing events, and a lineage tree
that follows the same time axis.

## Run it

No build step and no dependencies. Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000

The only external resource is the Google Fonts stylesheet. If it is blocked, system fonts are used.

## Publish on GitHub Pages

1. Push this folder to a repository.
2. Settings > Pages > deploy from the main branch, root folder.
3. The site appears at `https://<user>.github.io/<repo>/`.

## Files

- `index.html`: the whole app (HTML, CSS, JavaScript, data) in one file, about 57 KB.
- `data/sealevel_spratt_lisiecki_2016_0-300ka.csv`: a published sea-level curve. NOT used by the page yet.
- `data/SOURCES.txt`: source, citation and license notes for that CSV.
- `docs/HANDOFF.md`: context and a starter prompt for continuing the work in Claude Code.

## Code map (`index.html`, search for these comment markers)

| Section | What it holds |
|---|---|
| `time mapping` | `PK`/`TK` arrays: piecewise-linear map between slider position and years ago. Shared by slider and tree. |
| `sea level, approximate` | `SLK`: hand-typed sea-level curve `[kya, meters]`. `iceFrac()` turns sea level into an ice fraction. |
| `geography` | `LAND`, `SHELF` (areas that become land below a depth threshold), `ICE` (last-glacial-maximum outlines, scaled by ice fraction), `GREENLAND`. Coordinates are `[lon, lat]`. |
| `populations` | `GROUPS`: bubbles with keyframes `[kya, lon, lat, radius_deg]`. |
| `routes` | `ROUTES`: paths with continuous longitudes (values above 180 continue past the date line). `dash:true` draws a sea crossing. |
| `events` | `EVENTS`: cards and map markers. `tag` is `book`, `after`, `hyp` or `ctx`. `lon:null` means no marker. |
| `lineage tree` | `LANES`, `LINKS` (mixing arrows), `MARKS` (cross-in-circle markers on lanes). |
| `state and update` | `update()` redraws everything for the current time. `applyScale()` keeps labels and lines a constant size when the region zoom changes. |

To add an event: add an object to `EVENTS` (and a bubble, route, lane link or mark if it needs one).

## What is approximate

- Sea level, ice-sheet outlines, shelf outlines and depth thresholds are hand-typed approximations, not data exports. Ice outlines are the last glacial maximum shape scaled by sea level, which is not how real ice sheets changed.
- Population positions and routes are schematic.
- Tags (`book`, `after`, `hyp`, `ctx`) are the author's reading of the book. Check them against your edition.
- Africa after 60,000 years ago, the Pacific islands and the Bantu expansion are not drawn.

## Sources used for specific items

- Shinde et al. 2019, *Cell* (Rakhigarhi genome), and Narasimhan et al. 2019, *Science* 365:eaat7487 (South and Central Asia).
- Bird et al. 2019, *Scientific Reports* (sea crossings through Wallacea).
- Spratt and Lisiecki 2016, *Climate of the Past* 12:1079 (sea-level curve in `data/`).

## Licenses and credits (to do)

- No license has been chosen for the code. Add one (for example MIT) and your name.
- The book is paraphrased in short summaries. Do not paste passages from it.
- If the sea-level CSV is redistributed, confirm the license of the Spratt and Lisiecki data first (see `data/SOURCES.txt`).
