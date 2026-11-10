/* Ice-sheet layer: loads time-sliced ice outlines (GeoJSON) at runtime.
 * Standalone module (no dependency on the rest of the app).
 *
 *   const ice = await loadIce('data/ice_paleomist_1.0.geojson');
 *   ice.slices[i] = { age, polygons }   polygons: GeoJSON polygon coordinates, [ring, ring, ...], ring = [[lon,lat],...]
 *   ice.layers(t)  -> [{ index, opacity }]   which slices to draw at t kya, opacity 0..1 (cross-fade between slices)
 *   ice.schematicWeight(t) -> 0..1           how much of a fallback drawing is needed (1 beyond the data)
 *
 * The data cover 0 to maxAge kya. Between slices the two neighbouring outlines are cross-faded
 * (outlines are not morphed). The larger outline fades linearly; the smaller one is kept opaque
 * where both overlap, so the shared ice does not flicker. Beyond maxAge the last slice fades out
 * over fadeKa while schematicWeight rises from 0 to 1.
 */
export async function loadIce(url, fadeKa = 5) {
  const res = await fetch(url);
  if (!res.ok) { throw new Error('Ice file not loaded (' + res.status + '): ' + url); }
  const gj = await res.json();
  const slices = gj.features
    .map((f) => ({ age: f.properties.age_ka, polygons: f.geometry.coordinates }))
    .sort((a, b) => a.age - b.age);
  const area = (poly) => poly.reduce((s, ring, i) => {
    let a = 0;
    for (let k = 0; k < ring.length - 1; k++) { a += ring[k][0] * ring[k + 1][1] - ring[k + 1][0] * ring[k][1]; }
    return s + (i === 0 ? 1 : -1) * Math.abs(a) / 2;
  }, 0);
  slices.forEach((s) => { s.area = s.polygons.reduce((t, p) => t + area(p), 0); });
  const maxAge = slices[slices.length - 1].age;

  function layers(t, base = 0.92) {
    if (t <= slices[0].age) { return [{ index: 0, opacity: 1 }]; }
    if (t >= maxAge) {
      const f = 1 - (t - maxAge) / fadeKa;
      return f > 0 ? [{ index: slices.length - 1, opacity: f }] : [];
    }
    let i = 1;
    while (slices[i].age < t) { i++; }
    const lo = i - 1, hi = i;                              // younger, older slice
    const w = (t - slices[lo].age) / (slices[hi].age - slices[lo].age);   // 0 at lo, 1 at hi
    const bigIsHi = slices[hi].area >= slices[lo].area;
    const big = bigIsHi ? hi : lo, small = bigIsHi ? lo : hi;
    const wBig = bigIsHi ? w : 1 - w;
    const oBig = base * wBig;                              // 0..base, linear
    const oSmall = 1 - (1 - base) / (1 - oBig);            // keeps the overlap at `base`
    return [{ index: big, opacity: oBig / base }, { index: small, opacity: oSmall / base }];
  }
  const schematicWeight = (t) => Math.max(0, Math.min(1, (t - maxAge) / fadeKa));
  return { slices, maxAge, layers, schematicWeight };
}
