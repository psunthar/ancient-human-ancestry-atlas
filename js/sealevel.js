/* Sea-level layer: loads a published sea-level curve from CSV at runtime.
 * Standalone module (no dependency on the rest of the app).
 *
 *   const sea = await loadSeaLevel('data/sealevel_spratt_lisiecki_2016_0-300ka.csv');
 *   sea.at(17)  -> sea level in metres relative to present at 17 kya (linear interpolation)
 *
 * CSV columns: age_ka_BP, sea_level_m, ci95_lo_m, ci95_up_m (rows in increasing age).
 * The curve is shifted so that the first row (0 ka) reads 0 m; the shift is exposed as `offset`.
 */
export async function loadSeaLevel(url) {
  const res = await fetch(url);
  if (!res.ok) { throw new Error('Sea-level file not loaded (' + res.status + '): ' + url); }
  const lines = (await res.text()).trim().split(/\r?\n/);
  const head = lines.shift().split(',');
  const col = (name) => head.indexOf(name);
  const iA = col('age_ka_BP'), iS = col('sea_level_m'), iLo = col('ci95_lo_m'), iUp = col('ci95_up_m');
  if (iA < 0 || iS < 0) { throw new Error('Unexpected sea-level CSV header: ' + head.join(',')); }
  const rows = lines.map((l) => l.split(',').map(Number)).filter((r) => isFinite(r[iA]) && isFinite(r[iS]));
  rows.sort((a, b) => a[iA] - b[iA]);
  const offset = rows[0][iS];
  const pts = rows.map((r) => ({
    t: r[iA],
    sl: r[iS] - offset,
    lo: iLo >= 0 ? r[iLo] - offset : null,
    up: iUp >= 0 ? r[iUp] - offset : null,
  }));
  function at(t) {
    if (t <= pts[0].t) { return pts[0].sl; }
    for (let i = 1; i < pts.length; i++) {
      if (t <= pts[i].t) {
        const a = pts[i - 1], b = pts[i];
        return a.sl + (b.sl - a.sl) * (t - a.t) / (b.t - a.t);
      }
    }
    return pts[pts.length - 1].sl;
  }
  return { at, offset, points: pts, min: Math.min(...pts.map((p) => p.sl)) };
}
