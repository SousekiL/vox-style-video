// Vox map board (13-vox-editorial.md §map): Natural Earth land (public domain, via world-atlas),
// d3-geo projection, stripped basemap, labels set by us. By default NO political borders are drawn:
// border lines carry claims (and, for China, legal review requirements); a land-only locator map shows
// "where" without asserting boundaries. Add historical borders only from a cited source.
import React, {useMemo} from 'react';
import {geoConicEqualArea, geoPath, type GeoProjection} from 'd3-geo';
import {feature} from 'topojson-client';
import type {Topology, GeometryCollection} from 'topojson-specification';
import landTopo from 'world-atlas/land-50m.json';
import riversChina from './data/rivers-china-50m.json';
import {useVideoConfig} from 'remotion';
import {VOX} from './tokens';
import {camAt, camTransform, type CamKey} from './camera';

export type MapPoint = {lon: number; lat: number; label?: string; sub?: string; dx?: number; dy?: number; size?: number};

/** China-centred equal-area conic (parallels 25°/47°), fitted to a lon/lat box. */
export const chinaProjection = (width: number, height: number, box: [[number, number], [number, number]] = [[73, 18], [135, 54]]): GeoProjection =>
  geoConicEqualArea()
    .parallels([25, 47])
    .rotate([-105, 0])
    .fitExtent(
      [
        [0, 0],
        [width, height],
      ],
      {
        type: 'Feature',
        properties: {},
        geometry: {type: 'MultiPoint', coordinates: [box[0], box[1], [box[0][0], box[1][1]], [box[1][0], box[0][1]]]},
      },
    );

/**
 * Land-only map with camera keys in lon/lat. Strokes stay the same width while zooming (non-scaling-stroke).
 * `children(project)` can draw extra overlays (routes, labels) in screen px of the unzoomed map.
 */
export const LandMap: React.FC<{
  frame: number;
  fps: number;
  keys: Array<{at: number; lon: number; lat: number; scale: number}>;
  points?: MapPoint[];
  pointsAt?: number;
  drift?: number;
  labelFont?: string;
  /** draw the Yellow River and Yangtze (Natural Earth 50m centerlines) for orientation */
  rivers?: boolean;
  box?: [[number, number], [number, number]];
  children?: (project: (lon: number, lat: number) => [number, number]) => React.ReactNode;
}> = ({frame, fps, keys, points = [], pointsAt = 0, drift = 0.006, labelFont, rivers = false, box, children}) => {
  const {width, height} = useVideoConfig();
  const {land, project, d, riverD} = useMemo(() => {
    const topo = landTopo as unknown as Topology<{land: GeometryCollection}>;
    const landFc = feature(topo, topo.objects.land);
    const projection = chinaProjection(width, height, box);
    const path = geoPath(projection);
    const riverD = path(riversChina as unknown as GeoJSON.FeatureCollection) ?? '';
    return {land: landFc, project: (lon: number, lat: number) => projection([lon, lat]) as [number, number], d: path(landFc) ?? '', riverD};
  }, [width, height, box]);
  void land;
  const camKeys: CamKey[] = keys.map((k) => {
    const [x, y] = project(k.lon, k.lat);
    return {at: k.at, cx: (x / width) * 100, cy: (y / height) * 100, scale: k.scale};
  });
  const k = camAt(frame, camKeys);
  const s = k.scale * (1 + (drift * Math.max(0, frame)) / fps);
  const dot = height * 0.005;
  const showPts = frame >= pointsAt;
  const ptOpacity = Math.min(1, Math.max(0, (frame - pointsAt) / Math.round((6 * fps) / 30)));
  return (
    <div style={{position: 'absolute', inset: 0, background: VOX.water, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: camTransform(k.cx, k.cy, s)}}>
        <svg width={width} height={height} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <path d={d} fill={VOX.land} stroke={VOX.border} strokeOpacity={0.55} strokeWidth={height * 0.0012} vectorEffect="non-scaling-stroke" />
          {rivers ? <path d={riverD} fill="none" stroke="#8FA8B0" strokeWidth={height * 0.0035} strokeLinecap="round" vectorEffect="non-scaling-stroke" /> : null}
          {children ? children(project) : null}
        </svg>
      </div>
      {/* labels and dots are drawn in screen space so their size never scales with the zoom */}
      {showPts
        ? points.map((p, i) => {
            const [x, y] = project(p.lon, p.lat);
            const sx = 50 - s * k.cx + (s * x * 100) / width;
            const sy = 50 - s * k.cy + (s * y * 100) / height;
            return (
              <div key={i} style={{position: 'absolute', left: `${sx}%`, top: `${sy}%`, opacity: ptOpacity}}>
                <div style={{position: 'absolute', width: dot * 2 * (p.size ?? 1), height: dot * 2 * (p.size ?? 1), borderRadius: '50%', background: VOX.ink, transform: 'translate(-50%,-50%)'}} />
                {p.label ? (
                  <div
                    style={{
                      position: 'absolute',
                      left: (p.dx ?? 1.2) * dot * 2,
                      top: (p.dy ?? -1.6) * dot * 2,
                      fontFamily: labelFont,
                      fontWeight: 700,
                      fontSize: height * 0.03,
                      letterSpacing: '0.08em',
                      color: VOX.ink,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.label}
                    {p.sub ? <div style={{fontWeight: 400, fontSize: height * 0.02, letterSpacing: '0.04em', color: 'rgba(20,20,20,.7)', marginTop: height * 0.004}}>{p.sub}</div> : null}
                  </div>
                ) : null}
              </div>
            );
          })
        : null}
    </div>
  );
};
