#!/usr/bin/env python3
"""Build data/ice_batchelor2019_stages.geojson from the Batchelor et al. (2019) shapefiles.

Input: the folder holding the downloaded best-estimate shapefiles from https://osf.io/7jen3/,
named <STAGE>_<STAGE>_best_estimate.{shp,shx,dbf,prj} (see data/SOURCES.txt for the steps).
The shapefiles use a North Pole Lambert azimuthal equal-area projection; they are dissolved,
simplified, split along the 180-degree meridian, reprojected to longitude/latitude and clipped
to the map. Requires: pyshp, pyproj, shapely (2.x).
"""
import argparse, json
import shapefile
from pyproj import CRS, Transformer
from shapely.geometry import shape, box, mapping, LineString
from shapely.ops import unary_union, transform as shp_transform
from shapely.validation import make_valid

# stage -> (from_ka, to_ka), the time-slice limits given in the dataset's README
STAGES = {'MIS5a': (72, 86), 'MIS5b': (86, 92), 'MIS5c': (92, 108), 'MIS5d': (108, 117),
          'MIS6': (132, 190), 'MIS8': (243, 279)}
MIN_AREA_M2 = 2.0e10        # drop pieces under 20,000 km2 (the authors only map ice sheets > 50,000 km2)
PRE_TOL_M = 12000           # simplification in the projected plane
SEG_M = 40000               # densify long edges before reprojecting
POST_TOL_DEG = 0.2
CLIP = box(-180, 0, 180, 85)


def build(stage, folder):
    base = f'{folder}/{stage}_{stage}_best_estimate'
    crs = CRS.from_wkt(open(base + '.prj').read())
    tr = Transformer.from_crs(crs, 'EPSG:4326', always_xy=True).transform
    r = shapefile.Reader(base)
    parts = []
    for s in r.shapes():
        g = make_valid(shape(s.__geo_interface__))
        parts.append(g)
    g = unary_union(parts).buffer(0)
    g = g.simplify(PRE_TOL_M, preserve_topology=True)
    pieces = [p for p in (g.geoms if hasattr(g, 'geoms') else [g]) if p.geom_type == 'Polygon' and p.area >= MIN_AREA_M2]
    out = []
    big = 1e8
    seam = LineString([(0, 0), (0, big)])        # the 180 deg meridian north of the pole
    halves = (box(-big, -big, -1, big), box(1, -big, big, big))

    def emit(part):
        part = part.segmentize(SEG_M)
        ll = shp_transform(tr, part)
        ll = make_valid(ll).intersection(CLIP).simplify(POST_TOL_DEG, preserve_topology=True)
        for z in (ll.geoms if hasattr(ll, 'geoms') else [ll]):
            if z.geom_type == 'Polygon' and not z.is_empty and z.area > 0.5:
                out.append(z)

    for p in pieces:
        if not p.intersects(seam):
            emit(p)                               # no jump in longitude: reproject as it is
            continue
        for half in halves:                       # split on x = 0 so each piece stays on one side of +-180
            q = p.intersection(half)
            for part in (q.geoms if hasattr(q, 'geoms') else [q]):
                if part.geom_type == 'Polygon' and not part.is_empty:
                    emit(part)
    return out


def rnd(c, nd=1):
    return [round(c[0], nd), round(c[1], nd)] if isinstance(c[0], float) else [rnd(x, nd) for x in c]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='folder', required=True)
    ap.add_argument('--out', default='data/ice_batchelor2019_stages.geojson')
    a = ap.parse_args()
    feats = []
    for stage, (lo, hi) in STAGES.items():
        polys = build(stage, a.folder)
        coords = [rnd(mapping(p)['coordinates']) for p in polys]
        feats.append({'type': 'Feature', 'properties': {'stage': stage, 'from_ka': lo, 'to_ka': hi},
                      'geometry': {'type': 'MultiPolygon', 'coordinates': coords}})
        print(stage, len(polys), 'polygons')
    fc = {'type': 'FeatureCollection', 'properties': {'source': 'Batchelor et al. 2019, best-estimate Northern Hemisphere ice-sheet extent per marine isotope stage'}, 'features': feats}
    with open(a.out, 'w') as f:
        json.dump(fc, f, separators=(',', ':'))
    print(a.out, round(len(json.dumps(fc, separators=(',', ':'))) / 1024, 1), 'KB')


if __name__ == '__main__':
    main()
