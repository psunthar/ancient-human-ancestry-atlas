/* Continental-shelf layer: land exposed when sea level drops. Loads depth bands (GeoJSON) at runtime.
 * Standalone module (no dependency on the rest of the app).
 *
 *   const shelf = await loadShelf('data/shelf_etopo2022.geojson');
 *   shelf.bands[k] = { from, to, polygons }   present-day sea floor between `from` and `to` metres deep
 *   shelf.exposure(band, seaLevelM) -> 0..1   share of the band that is dry at that sea level
 *
 * Exposure is interpolated linearly between the band's depth limits, so a band is fully dry when sea
 * level is at or below -to, and not at all dry at or above -from. Present-day bathymetry is used at all
 * times; uplift and subsidence (isostasy) are ignored.
 */
export async function loadShelf(url) {
  const res = await fetch(url);
  if (!res.ok) { throw new Error('Shelf file not loaded (' + res.status + '): ' + url); }
  const gj = await res.json();
  const bands = gj.features
    .map((f) => ({ from: f.properties.depth_from_m, to: f.properties.depth_to_m, polygons: f.geometry.coordinates }))
    .sort((a, b) => a.from - b.from);
  const exposure = (band, sl) => Math.max(0, Math.min(1, (-sl - band.from) / (band.to - band.from)));
  return { bands, exposure };
}
