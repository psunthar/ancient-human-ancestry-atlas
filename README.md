# Ahaa! Timeline Atlas of Ancient Human Ancestry

**Live page: https://psunthar.github.io/ancient-human-ancestry-atlas/**

An interactive timeline map of human origins, migrations and population mixing from 300,000 years ago to the present. It animates the hypotheses in David Reich's book *Who We Are and How We Got Here* (2018): Out of Africa, mixing with Neanderthals and Denisovans, the peopling of Australasia and the Americas, the spread of farming, the Steppe expansion, and the formation of present-day South Asians. A lineage tree on the same time axis shows who mixed with whom. Ice sheets, sea level and land exposed by lower sea level are drawn from published datasets.

> **Work in progress.** This atlas shows the hypotheses of the book, as the author reads them, plus a few later results (tagged "After the book"). It is not a settled account of human history. Dates, lineages, routes and the size of the population circles are schematic and are still being reviewed. For factual claims cite the book and the papers listed in `data/SOURCES.txt`, not this atlas.

Keywords: human evolution, ancient DNA, archaeogenetics, human migration map, Out of Africa, Neanderthal admixture, Denisovans, population genetics, David Reich, interactive timeline, ice age, sea level, Sahul, Sunda, Beringia, Indus Valley, Yamnaya.

## Run it

No build step and no dependencies for the main page. It loads data files at run time, so serve the folder over HTTP (browsers block this from `file://`, so double-clicking `index.html` shows a notice instead of the atlas):

    python3 -m http.server 8000
    # then open http://localhost:8000/

**Open from disk:** `atlas-standalone.html` is the whole atlas in one file (scripts and data inlined, about 560 KB). Double-click it. It is generated, so do not edit it. After changing any source file or data file, regenerate it:

    python3 tools/build_standalone.py

## Publish on GitHub Pages

Settings > Pages > Deploy from a branch > `main` > `/ (root)`. The site appears at `https://<user>.github.io/<repo>/`.

## Files

| Path | What it is |
|---|---|
| `index.html` | page structure, text, search and social metadata |
| `css/style.css` | styles |
| `js/app.js` | the app: time mapping, map drawing, tree, controls |
| `js/data/*.js` | hand-typed content: `geography`, `populations`, `routes`, `events`, `tree`, `ice_schematic` |
| `js/sealevel.js` | sea-level layer: loads a CSV at run time |
| `js/ice.js` | ice-sheet layer, 0 to 80 ka: loads time-sliced GeoJSON at run time |
| `js/icestages.js` | ice-sheet layer, 72 to 279 ka: loads one outline per marine isotope stage |
| `js/shelf.js` | continental-shelf layer: loads depth-band GeoJSON at run time |
| `data/` | the CSV and GeoJSON files, and `SOURCES.txt` (source, citation, licence of each) |
| `atlas-standalone.html` | generated single-file copy that opens from disk (do not edit) |
| `tools/build_standalone.py` | builds `atlas-standalone.html` from the sources (standard library only) |
| `tools/build_ice_stages.py` | rebuilds the older ice GeoJSON from the Batchelor et al. shapefiles |
| `tools/build_ice_shelf.py` | rebuilds the ice and shelf GeoJSON from the original datasets |
| `docs/HANDOFF.md` | context and starter prompt for continuing the work |
| `llms.txt`, `robots.txt`, `sitemap.xml` | discovery files for AI agents and search engines |

The data layers (`sealevel.js`, `ice.js`, `icestages.js`, `shelf.js`) are independent modules. Each fetches its own file and exposes a small interface, so a layer can be swapped for another dataset without touching the rest of the app.

## Data layers

- **Sea level**: Spratt and Lisiecki (2016) stack, shifted so 0 ka reads 0 m (the stack gives +8.5 m for the present). After the shift the last interglacial peak (about 121 ka) is about 5 m below today.
- **Ice sheets, 0 to 80 ka**: PaleoMIST 1.0 (Gowan et al. 2021), grounded ice thicker than 10 m, one slice every 2,500 years, cross-faded between slices.
- **Ice sheets, 72 to 279 ka**: Batchelor et al. (2019) best-estimate outlines for marine isotope stages 5a, 5b, 5c, 5d, 6 and 8 (Northern Hemisphere only). Each is the extent at the height of its stage, shrunk with sea level inside the stage (my simplification). Reuse terms for these shapefiles are unconfirmed; see `data/SOURCES.txt`.
- **Ice sheets, gaps** (about 117 to 132, 190 to 243 and 279 to 300 ka, and the Southern Hemisphere): schematic outlines, not data (the last glacial maximum shape scaled by sea level).
- **Exposed shelf**: ETOPO 2022 present-day depth bands (0 to 30, 30 to 60, 60 to 90, 90 to 130 m); isostatic movement is ignored.

## Code map (`js/app.js`, search for these comment markers)

| Section | What it holds |
|---|---|
| `time mapping` | `PK`/`TK`: piecewise-linear map between slider position and years ago, shared by slider and tree |
| `runtime data layers` | loads sea level, ice and shelf before the first draw; shows an error if a file is missing |
| `DOM setup` | draws land, shelf, ice, routes, population circles and event markers |
| `state and update` | `update()` redraws everything for the current time; `applyScale()` keeps labels and lines a constant size when the region zoom changes |

Content lives in `js/data/`: `GROUPS` (circles with keyframes `[kya, lon, lat, radius_deg]`), `ROUTES` (paths; longitudes above 180 continue past the date line; `dash:true` is a sea crossing), `EVENTS` (cards and markers; `tag` is `book`, `after`, `hyp` or `ctx`), `LANES`, `LINKS` and `MARKS` (lineage tree). An event can carry an `outdated:'note'` field: a claim of the book that later research has revised. It gets a red "Outdated" tag and the note, and the "Outdated claims" checkbox above the map shows or hides it (on the map, in the cards and in the jump list). Add notes only after checking the primary paper. To add an event, add an object to `EVENTS`, and a circle, route, lane link or mark if it needs one.

## What is approximate

- Land and coast outlines are coarse hand-typed shapes.
- Population positions, routes and circle sizes are schematic.
- Tags (`book`, `after`, `hyp`, `ctx`) are the author's reading of the book. Check them against your edition.
- Africa after 60,000 years ago, the Pacific islands and the Bantu expansion are not drawn.

## Sources

Full source, version, licence and changes for each data file are in `data/SOURCES.txt`. Main references:

- Reich, D. (2018) *Who We Are and How We Got Here*. Pantheon.
- Spratt and Lisiecki (2016), *Climate of the Past* 12:1079, doi:10.5194/cp-12-1079-2016.
- Gowan et al. (2021), *Nature Communications* 12:1199, doi:10.1038/s41467-021-21469-w; data doi:10.1594/PANGAEA.905800.
- NOAA NCEI (2022), ETOPO 2022 Global Relief Model, doi:10.25921/fd45-gt74.
- Shinde et al. 2019, *Cell*, and Narasimhan et al. 2019, *Science* 365:eaat7487 (South and Central Asia).
- Bird et al. 2019, *Scientific Reports* (sea crossings through Wallacea).

The book is paraphrased in short summaries; no passages are copied.

## Licence

Created by P Sunthar. The code, text and original content of this project are licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) (see `LICENSE`): attribution, non-commercial, share alike. The data files under `data/` keep the licences of their sources (CC BY 4.0, public domain and others), listed in `data/SOURCES.txt`.
