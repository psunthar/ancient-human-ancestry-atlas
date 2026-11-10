#!/usr/bin/env python3
"""Build data/ice_paleomist_1.0.geojson and data/shelf_etopo2022.geojson.

Inputs (not stored in the repo; see data/SOURCES.txt for where to get them):
  --paleomist  reconstruction_1_degree.nc   (PaleoMIST 1.0, PANGAEA doi:10.1594/PANGAEA.905800)
  --etopo      etopo2022_bed_15arcmin.npz   (ETOPO 2022 60 arc-second bed elevation, every 15th
                                             sample, arrays lat, lon, z; made by build step below)
Requires: numpy, scipy, netCDF4, shapely, contourpy.
"""
import argparse, json
import numpy as np
from scipy.ndimage import zoom, gaussian_filter
import netCDF4
import contourpy
from contourpy import FillType
from shapely.geometry import Polygon, box, mapping

CLIP = box(-180, -58, 180, 85)          # the map shows 80N to 58S
ICE_MIN_M = 10.0                        # grounded ice thinner than this is not drawn
ICE_TOL, ICE_MIN_AREA = 0.25, 0.6       # simplification tolerance (deg), minimum polygon area (deg^2)
SHELF_DEPTHS = [30, 60, 90, 130]        # band k holds depths between SHELF_DEPTHS[k-1] and SHELF_DEPTHS[k]
SHELF_TOL, SHELF_MIN_AREA = 0.15, 0.5
SHELF_SMOOTH = 1.0                      # Gaussian sigma in 15-arcmin cells, removes fjord-scale detail


def polygons(lon, lat, z, lo, hi):
    gen = contourpy.contour_generator(lon, lat, z, fill_type=FillType.OuterCode)
    pts, codes = gen.filled(lo, hi)
    out = []
    for p, c in zip(pts, codes):
        starts = [i for i, k in enumerate(c) if k == 1] + [len(c)]
        rings = [p[a:b] for a, b in zip(starts[:-1], starts[1:])]
        rings = [r for r in rings if len(r) >= 4]
        if rings:
            poly = Polygon(rings[0], rings[1:])
            if not poly.is_valid:
                poly = poly.buffer(0)
            out.append(poly)
    return out


def finish(polys, tol, min_area):
    keep = []
    for g in polys:
        g = g.intersection(CLIP)
        for part in (g.geoms if hasattr(g, 'geoms') else [g]):
            if part.geom_type != 'Polygon' or part.area < min_area:
                continue
            s = part.simplify(tol, preserve_topology=True)
            if s.is_valid and not s.is_empty and s.geom_type == 'Polygon':
                keep.append(s)
    return keep


def rounded(geom_dict, nd):
    def r(c):
        return [round(c[0], nd), round(c[1], nd)] if isinstance(c[0], float) else [r(x) for x in c]
    geom_dict['coordinates'] = r(geom_dict['coordinates'])
    return geom_dict


def write(path, features, meta):
    fc = {'type': 'FeatureCollection', 'properties': meta, 'features': features}
    with open(path, 'w') as f:
        json.dump(fc, f, separators=(',', ':'))
    print(path, round(len(json.dumps(fc, separators=(',', ':'))) / 1024, 1), 'KB,', len(features), 'features')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--paleomist', required=True)
    ap.add_argument('--etopo', required=True)
    ap.add_argument('--out', default='data')
    a = ap.parse_args()

    d = netCDF4.Dataset(a.paleomist)
    lon, lat = d['lon'][:], d['lat'][:]
    t = np.abs(np.asarray(d['time'][:], dtype=float)) / 1000.0     # years since 1950 -> ka before 1950
    order = np.argsort(t)
    lon2 = np.linspace(lon[0], lon[-1], (len(lon) - 1) * 2 + 1)
    lat2 = np.linspace(lat[0], lat[-1], (len(lat) - 1) * 2 + 1)
    feats = []
    for i in order:
        th = np.nan_to_num(np.ma.filled(d['ice_thickness'][i], 0.0)).astype(float)
        th = zoom(th, 2, order=1)[:len(lat2), :len(lon2)]
        ps = finish(polygons(lon2, lat2, th, ICE_MIN_M, 1e9), ICE_TOL, ICE_MIN_AREA)
        coords = [mapping(p)['coordinates'] for p in ps]
        feats.append({'type': 'Feature', 'properties': {'age_ka': round(float(t[i]), 3)},
                      'geometry': {'type': 'MultiPolygon', 'coordinates': rounded({'coordinates': coords}, 1)['coordinates']}})
    write(f'{a.out}/ice_paleomist_1.0.geojson', feats,
          {'source': 'PaleoMIST 1.0 (Gowan et al. 2021), grounded ice thickness >= %g m' % ICE_MIN_M})

    e = np.load(a.etopo)
    elon, elat, z = e['lon'], e['lat'], e['z'].astype(float)
    z = gaussian_filter(z, SHELF_SMOOTH, mode='nearest')
    feats = []
    bounds = [0] + SHELF_DEPTHS
    for k in range(1, len(bounds)):
        d0, d1 = bounds[k - 1], bounds[k]
        ps = finish(polygons(elon, elat, z, -d1, -d0 + (0.001 if d0 == 0 else 0)), SHELF_TOL, SHELF_MIN_AREA)
        coords = [mapping(p)['coordinates'] for p in ps]
        feats.append({'type': 'Feature', 'properties': {'depth_from_m': d0, 'depth_to_m': d1},
                      'geometry': {'type': 'MultiPolygon', 'coordinates': rounded({'coordinates': coords}, 2)['coordinates']}})
    write(f'{a.out}/shelf_etopo2022.geojson', feats,
          {'source': 'ETOPO 2022 bed elevation, bands between the listed depths below present sea level'})


if __name__ == '__main__':
    main()
