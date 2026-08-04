import type { BuoyDefinition } from '@/types/buoyage';
import { groupFlash } from '@/data/buoyage/light-patterns';

type Shape = 'can' | 'cone' | 'pillar' | 'spar';

function preferred(opts: {
  id: string;
  name: string;
  region: 'A' | 'B';
  to: 'port' | 'starboard';
  shape: Shape;
  /** Outer / band colours — outer first for SVG fallback */
  bodyColours: [string, string];
  lightColour: 'red' | 'green';
  description: string;
}): BuoyDefinition {
  const lightChar = opts.lightColour === 'red' ? 'Fl(2+1) R 10s' : 'Fl(2+1) G 10s';
  return {
    id: opts.id,
    name: opts.name,
    category: 'preferred-channel',
    region: opts.region,
    bodyColours: opts.bodyColours,
    topmark:
      opts.to === 'port'
        ? `Preferred channel to port · ${opts.shape}`
        : `Preferred channel to starboard · ${opts.shape}`,
    lightColour: opts.lightColour,
    lightCharacteristic: lightChar,
    periodSec: 10,
    flashSequence: groupFlash([2, 1], 10),
    description: opts.description,
    // SVG fallback uses matching lateral silhouette
    svgDay: opts.to === 'port' ? 'lateral-starboard' : 'lateral-port',
    svgNight: opts.to === 'port' ? 'lateral-starboard' : 'lateral-port',
  };
}

function shapeLabel(shape: Shape) {
  return shape.charAt(0).toUpperCase() + shape.slice(1);
}

/** Region A: green+red band → to port; red+green band → to starboard */
export const preferredRegionA: BuoyDefinition[] = [
  ...(['cone', 'pillar', 'spar'] as Shape[]).map((shape) =>
    preferred({
      id: `preferred-port-${shape}-a`,
      name: `Preferred Channel to Port ${shapeLabel(shape)} (A)`,
      region: 'A',
      to: 'port',
      shape,
      bodyColours: ['#2E7D32', '#E53935'],
      lightColour: 'green',
      description:
        `IALA Region A preferred channel to port (${shape}). Green with one red horizontal band. Main channel is to port of the mark.`,
    }),
  ),
  ...(['can', 'pillar', 'spar'] as Shape[]).map((shape) =>
    preferred({
      id: `preferred-starboard-${shape}-a`,
      name: `Preferred Channel to Starboard ${shapeLabel(shape)} (A)`,
      region: 'A',
      to: 'starboard',
      shape,
      bodyColours: ['#E53935', '#2E7D32'],
      lightColour: 'red',
      description:
        `IALA Region A preferred channel to starboard (${shape}). Red with one green horizontal band. Main channel is to starboard of the mark.`,
    }),
  ),
];

/** Region B: colours reverse vs Region A (reuse opposite art via image map). */
export const preferredRegionB: BuoyDefinition[] = [
  ...(['can', 'pillar', 'spar'] as Shape[]).map((shape) =>
    preferred({
      id: `preferred-port-${shape}-b`,
      name: `Preferred Channel to Port ${shapeLabel(shape)} (B)`,
      region: 'B',
      to: 'port',
      shape,
      bodyColours: ['#E53935', '#2E7D32'],
      lightColour: 'red',
      description:
        `IALA Region B preferred channel to port (${shape}). Red with one green horizontal band. Main channel is to port of the mark.`,
    }),
  ),
  ...(['cone', 'pillar', 'spar'] as Shape[]).map((shape) =>
    preferred({
      id: `preferred-starboard-${shape}-b`,
      name: `Preferred Channel to Starboard ${shapeLabel(shape)} (B)`,
      region: 'B',
      to: 'starboard',
      shape,
      bodyColours: ['#2E7D32', '#E53935'],
      lightColour: 'green',
      description:
        `IALA Region B preferred channel to starboard (${shape}). Green with one red horizontal band. Main channel is to starboard of the mark.`,
    }),
  ),
];
