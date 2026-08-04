import type { BuoyCategory, BuoyDefinition, IalaRegion, SidebarCategory } from '@/types/buoyage';
import { withMarkImages } from '@/lib/buoyage/assets';
import { cardinalMarks } from './definitions/cardinal';
import { lateralRegionA, lateralRegionB } from './definitions/lateral';
import { preferredRegionA, preferredRegionB } from './definitions/preferred';
import {
  emergencyWreck,
  isolatedDanger,
  safeWater,
  specialMark,
} from './definitions/others';

const RAW: BuoyDefinition[] = [
  ...lateralRegionA,
  ...lateralRegionB,
  ...preferredRegionA,
  ...preferredRegionB,
  ...cardinalMarks,
  isolatedDanger,
  safeWater,
  specialMark,
  emergencyWreck,
];

/** Registry with mapped day art where available */
const ALL: BuoyDefinition[] = RAW.map((d) => withMarkImages(d));

const byId = new Map(ALL.map((d) => [d.id, d]));

export function getDefinition(id: string): BuoyDefinition | undefined {
  return byId.get(id);
}

export function getAllDefinitions(): BuoyDefinition[] {
  return ALL;
}

/** Definitions visible in the sidebar for the active region */
export function getDefinitionsForRegion(region: IalaRegion): BuoyDefinition[] {
  return ALL.filter((d) => {
    if (d.region === 'both' || d.region == null) return true;
    return d.region === region;
  });
}

export function getSidebarCategories(region: IalaRegion): SidebarCategory[] {
  const defs = getDefinitionsForRegion(region);

  const group = (category: BuoyCategory, label: string): SidebarCategory => ({
    id: category,
    label,
    definitionIds: defs.filter((d) => d.category === category).map((d) => d.id),
  });

  return [
    group('lateral', 'Lateral Marks'),
    group('preferred-channel', 'Preferred Channel'),
    group('cardinal', 'Cardinal Marks'),
    group('isolated-danger', 'Isolated Danger'),
    group('safe-water', 'Safe Water'),
    group('special', 'Special Mark'),
    group('emergency-wreck', 'Emergency Wreck Mark'),
  ].filter((c) => c.definitionIds.length > 0);
}

export { ALL as BUOY_DEFINITIONS };
