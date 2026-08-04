import type { BuoyDefinition } from '@/types/buoyage';
import { flashing } from '@/data/buoyage/light-patterns';

type Shape = 'can' | 'cone' | 'pillar' | 'spar';

function lateral(opts: {
  id: string;
  name: string;
  region: 'A' | 'B';
  hand: 'port' | 'starboard';
  shape: Shape;
  bodyColour: string;
  lightColour: 'red' | 'green';
  description: string;
}): BuoyDefinition {
  const lightChar = opts.lightColour === 'red' ? 'Fl R 5s' : 'Fl G 5s';
  const topmark =
    opts.hand === 'port'
      ? 'Can (cylinder) topmark'
      : 'Cone (point up) topmark';
  return {
    id: opts.id,
    name: opts.name,
    category: 'lateral',
    region: opts.region,
    bodyColours: [opts.bodyColour],
    topmark: `${topmark} · ${opts.shape}`,
    lightColour: opts.lightColour,
    lightCharacteristic: lightChar,
    periodSec: 5,
    flashSequence: flashing(5, 0.3),
    description: opts.description,
    svgDay: opts.hand === 'port' ? 'lateral-port' : 'lateral-starboard',
    svgNight: opts.hand === 'port' ? 'lateral-port' : 'lateral-starboard',
  };
}

const PORT_SHAPES: Shape[] = ['can', 'pillar', 'spar'];
const STARBOARD_SHAPES: Shape[] = ['cone', 'pillar', 'spar'];

function shapeLabel(shape: Shape) {
  return shape.charAt(0).toUpperCase() + shape.slice(1);
}

/** Region A: port = red can/pillar/spar, starboard = green cone/pillar/spar */
export const lateralRegionA: BuoyDefinition[] = [
  ...PORT_SHAPES.map((shape) =>
    lateral({
      id: `lateral-port-${shape}-a`,
      name: `Port Hand ${shapeLabel(shape)} (Region A)`,
      region: 'A',
      hand: 'port',
      shape,
      bodyColour: '#E53935',
      lightColour: 'red',
      description:
        `IALA Region A port-hand lateral mark (${shape}). Red. Leave to port when entering harbour / proceeding in the conventional direction of buoyage.`,
    }),
  ),
  ...STARBOARD_SHAPES.map((shape) =>
    lateral({
      id: `lateral-starboard-${shape}-a`,
      name: `Starboard Hand ${shapeLabel(shape)} (Region A)`,
      region: 'A',
      hand: 'starboard',
      shape,
      bodyColour: '#2E7D32',
      lightColour: 'green',
      description:
        `IALA Region A starboard-hand lateral mark (${shape}). Green. Leave to starboard when entering harbour / proceeding in the conventional direction of buoyage.`,
    }),
  ),
];

/** Region B: port = green can/pillar/spar, starboard = red cone/pillar/spar */
export const lateralRegionB: BuoyDefinition[] = [
  ...PORT_SHAPES.map((shape) =>
    lateral({
      id: `lateral-port-${shape}-b`,
      name: `Port Hand ${shapeLabel(shape)} (Region B)`,
      region: 'B',
      hand: 'port',
      shape,
      bodyColour: '#2E7D32',
      lightColour: 'green',
      description:
        `IALA Region B port-hand lateral mark (${shape}). Green. Leave to port when entering harbour / proceeding in the conventional direction of buoyage.`,
    }),
  ),
  ...STARBOARD_SHAPES.map((shape) =>
    lateral({
      id: `lateral-starboard-${shape}-b`,
      name: `Starboard Hand ${shapeLabel(shape)} (Region B)`,
      region: 'B',
      hand: 'starboard',
      shape,
      bodyColour: '#E53935',
      lightColour: 'red',
      description:
        `IALA Region B starboard-hand lateral mark (${shape}). Red. Leave to starboard when entering harbour / proceeding in the conventional direction of buoyage.`,
    }),
  ),
];
