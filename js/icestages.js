/* Older ice-sheet layer: one outline per marine isotope stage (Northern Hemisphere), loaded at runtime.
 * Standalone module (no dependency on the rest of the app).
 *
 *   const stages = await loadIceStages('data/ice_batchelor2019_stages.geojson');
 *   stages.slices[i] = { stage, from, to, polygons }   from/to in kya, polygons as in js/ice.js
 *   stages.layers(t, youngLimit) -> [{ index, opacity }]   slices to draw at t kya
 *   stages.coverage(t, youngLimit) -> 0..1                 how much of the time axis the slices cover at t
 *
 * Each outline is the extent at the height of its stage, not a time series, and stages may span many
 * thousand years. A slice is fully drawn inside [from, to] and fades out over fadeKa beyond either end.
 * Nothing is drawn younger than youngLimit (the age where a better dataset, js/ice.js, takes over).
 */
export async function loadIceStages(url, fadeKa = 4) {
  const res = await fetch(url);
  if (!res.ok) { throw new Error('Ice-stage file not loaded (' + res.status + '): ' + url); }
  const gj = await res.json();
  const slices = gj.features
    .map((f) => ({ stage: f.properties.stage, from: f.properties.from_ka, to: f.properties.to_ka, polygons: f.geometry.coordinates }))
    .sort((a, b) => a.from - b.from);
  function layers(t, youngLimit = 0) {
    if (t < youngLimit) { return []; }
    const out = [];
    slices.forEach((s, index) => {
      const d = t < s.from ? s.from - t : (t > s.to ? t - s.to : 0);
      const opacity = 1 - d / fadeKa;
      if (opacity > 0) { out.push({ index, opacity }); }
    });
    return out;
  }
  const coverage = (t, youngLimit = 0) => layers(t, youngLimit).reduce((m, l) => Math.max(m, l.opacity), 0);
  return { slices, layers, coverage };
}
