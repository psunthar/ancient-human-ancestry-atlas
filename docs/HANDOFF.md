# Handoff: context and starter prompt for Claude Code

## Context

`index.html` ("Timeline Atlas of Ancient Human Ancestry") is a self-contained interactive atlas for the book
*Who We Are and How We Got Here* (David Reich, 2018). It was built in a Claude chat session. Decisions made there:

- Time range 300,000 years ago to present; slider uses a piecewise-linear time scale (`PK`/`TK`).
- Ice/sea-level/land layers are simplified approximations, labeled as such on the page.
- A background search for real data got only the sea-level curve (Spratt and Lisiecki 2016, in `data/`).
  Ice-sheet polygons (Dalton NADI, PaleoMIST, DATED-1) and bathymetry (GEBCO) were not reachable
  from the chat sandbox. They live on Zenodo, PANGAEA and GEBCO, which a normal machine can download.
- Known issue found: the curve reads +8.5 m at 0 ka, so it must be shifted to zero at present. After the shift,
  the 120-130 ka values differ strongly from the hand-typed curve (the stack dates the last interglacial peak
  and the following rise differently). Decide how to handle this and document it on the page.
- South Asia items tagged `after` come from 2019 papers published after the book.
- Content rule: paraphrase the book briefly. Do not paste book passages.

## Starter prompt

> I have a static site in this folder (`index.html`, `README.md`, `docs/HANDOFF.md`, `data/`). Read the README and
> HANDOFF first. Goals, in order:
> 1. Split `index.html` into `index.html`, `css/style.css`, `js/app.js` and `js/data/*.js` (geography, populations,
>    routes, events, tree, sea level) using plain ES modules, with no build step and no dependencies. Behavior and
>    appearance must stay identical. Check by loading the page in headless Chrome at three slider positions
>    (about 17,000, 47,000 and 5,500 years ago) before and after, and compare screenshots.
> 2. Replace the hand-typed sea-level array with `data/sealevel_spratt_lisiecki_2016_0-300ka.csv`, shifted so that
>    0 ka equals 0 m, loaded at runtime. Add the citation on the page. Tell me how the 120-130 ka values change.
> 3. Download real ice-sheet outlines (Dalton et al. NADI-2 for North America; PaleoMIST or DATED-1 for Eurasia)
>    and GEBCO or ETOPO depth contours at -30, -60, -90 and -130 m. Simplify them to GeoJSON under about
>    600 KB total, and replace `ICE` and `SHELF`. Record source, version and license for each file in `data/SOURCES.txt`.
> 4. Add keyboard support and a visible focus state for the tree, a text alternative for the map at the current time,
>    and a small automated check that every event, route and lane id referenced in the data exists.
> 5. Add a LICENSE file (ask me which) and an author line.
> Work in small commits. Ask me before changing any wording about what the book says.
