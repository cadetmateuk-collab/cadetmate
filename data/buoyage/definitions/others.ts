import type { BuoyDefinition } from '@/types/buoyage';
import { alternatingOcculting, flashing, groupFlash, longFlash } from '@/data/buoyage/light-patterns';

export const isolatedDanger: BuoyDefinition = {
  id: 'isolated-danger',
  name: 'Isolated Danger',
  category: 'isolated-danger',
  region: 'both',
  bodyColours: ['#000000', '#E53935'],
  topmark: 'Two black spheres',
  lightColour: 'white',
  lightCharacteristic: 'Fl(2) 5s',
  periodSec: 5,
  flashSequence: groupFlash([2], 5),
  description:
    'Isolated danger mark. Black with one or more red bands. Indicates a danger that can be passed on all sides. Light: group flashing (2) white.',
  svgDay: 'isolated-danger',
  svgNight: 'isolated-danger',
};

export const safeWater: BuoyDefinition = {
  id: 'safe-water',
  name: 'Safe Water',
  category: 'safe-water',
  region: 'both',
  bodyColours: ['#E53935', '#FFFFFF'],
  topmark: 'Single red sphere',
  lightColour: 'white',
  lightCharacteristic: 'LFl 10s',
  periodSec: 10,
  flashSequence: longFlash(10, 5),
  description:
    'Safe water mark. Red and white vertical stripes. Indicates navigable water all around (e.g. mid-channel, landfall). Light: long flash white (4–6s flash).',
  svgDay: 'safe-water',
  svgNight: 'safe-water',
};

export const specialMark: BuoyDefinition = {
  id: 'special-mark',
  name: 'Special Mark',
  category: 'special',
  region: 'both',
  bodyColours: ['#F5C518'],
  topmark: 'Yellow cross (X)',
  lightColour: 'yellow',
  lightCharacteristic: 'Fl Y 5s',
  periodSec: 5,
  flashSequence: flashing(5, 0.3),
  description:
    'Special mark. Yellow. Indicates a special area or feature (TSS, spoil ground, cables, recreation zone, etc.). Light: yellow, any rhythm other than those used for white lights of cardinal, isolated danger, and safe water.',
  svgDay: 'special',
  svgNight: 'special',
};

export const emergencyWreck: BuoyDefinition = {
  id: 'emergency-wreck',
  name: 'Emergency Wreck Mark',
  category: 'emergency-wreck',
  region: 'both',
  bodyColours: ['#1E88E5', '#F5C518'],
  topmark: 'Vertical yellow cross',
  lightColour: 'blue',
  lightCharacteristic: 'Al Oc BuY 3s',
  periodSec: 3,
  flashSequence: alternatingOcculting(['blue', 'yellow'], 3),
  description:
    'Emergency wreck marking buoy. Blue and yellow vertical stripes. Deployed for new dangerous wrecks. Light: alternating occulting blue and yellow.',
  svgDay: 'emergency-wreck',
  svgNight: 'emergency-wreck',
};
