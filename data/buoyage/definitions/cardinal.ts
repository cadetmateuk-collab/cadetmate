import type { BuoyDefinition } from '@/types/buoyage';
import { groupQuickFlash, quickFlash } from '@/data/buoyage/light-patterns';

function southCardinalSequence(): BuoyDefinition['flashSequence'] {
  // Q(6)+LFl 15s: six quick flashes (~1s each at 60/min), then long flash, then dark
  const flashOn = 0.4;
  const flashOff = 0.6;
  const seq: BuoyDefinition['flashSequence'] = [];
  for (let i = 0; i < 6; i++) {
    seq.push({ on: true, duration: flashOn });
    seq.push({ on: false, duration: flashOff });
  }
  seq.push({ on: true, duration: 5 }); // LFl (IALA long flash 4–6s)
  const used = seq.reduce((s, x) => s + x.duration, 0);
  seq.push({ on: false, duration: Math.max(0.5, 15 - used) });
  return seq;
}

export const cardinalMarks: BuoyDefinition[] = [
  {
    id: 'cardinal-north',
    name: 'North Cardinal',
    category: 'cardinal',
    region: 'both',
    bodyColours: ['#000000', '#F5C518'],
    topmark: 'Two cones point up',
    lightColour: 'white',
    lightCharacteristic: 'Q',
    periodSec: 1,
    flashSequence: quickFlash(60),
    description:
      'North cardinal mark. Black over yellow. Pass to the north of the mark. Light: continuous quick flashing white.',
    svgDay: 'cardinal-north',
    svgNight: 'cardinal-north',
  },
  {
    id: 'cardinal-east',
    name: 'East Cardinal',
    category: 'cardinal',
    region: 'both',
    bodyColours: ['#000000', '#F5C518'],
    topmark: 'Two cones base to base',
    lightColour: 'white',
    lightCharacteristic: 'Q(3) 10s',
    periodSec: 10,
    flashSequence: groupQuickFlash(3, 10, 60),
    description:
      'East cardinal mark. Black with yellow band. Pass to the east of the mark. Light: three quick flashes every 10 seconds.',
    svgDay: 'cardinal-east',
    svgNight: 'cardinal-east',
  },
  {
    id: 'cardinal-south',
    name: 'South Cardinal',
    category: 'cardinal',
    region: 'both',
    bodyColours: ['#F5C518', '#000000'],
    topmark: 'Two cones point down',
    lightColour: 'white',
    lightCharacteristic: 'Q(6)+LFl 15s',
    periodSec: 15,
    flashSequence: southCardinalSequence(),
    description:
      'South cardinal mark. Yellow over black. Pass to the south of the mark. Light: six quick flashes followed by one long flash every 15 seconds.',
    svgDay: 'cardinal-south',
    svgNight: 'cardinal-south',
  },
  {
    id: 'cardinal-west',
    name: 'West Cardinal',
    category: 'cardinal',
    region: 'both',
    bodyColours: ['#F5C518', '#000000'],
    topmark: 'Two cones point to point',
    lightColour: 'white',
    lightCharacteristic: 'Q(9) 15s',
    periodSec: 15,
    flashSequence: groupQuickFlash(9, 15, 60),
    description:
      'West cardinal mark. Yellow with black band. Pass to the west of the mark. Light: nine quick flashes every 15 seconds.',
    svgDay: 'cardinal-west',
    svgNight: 'cardinal-west',
  },
];
