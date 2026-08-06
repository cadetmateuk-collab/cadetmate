export type IalaRegion = 'A' | 'B';

export type BuoyCategory =
  | 'lateral'
  | 'preferred-channel'
  | 'cardinal'
  | 'isolated-danger'
  | 'safe-water'
  | 'special'
  | 'emergency-wreck'
  | 'light-vessel'
  | 'leading-lights'
  | 'racons'
  | 'buoy-lights'
  | 'misc';

export type LightColour = 'red' | 'green' | 'white' | 'yellow' | 'blue' | 'none';

export type SvgMarkKey =
  | 'lateral-port'
  | 'lateral-starboard'
  | 'cardinal-north'
  | 'cardinal-east'
  | 'cardinal-south'
  | 'cardinal-west'
  | 'isolated-danger'
  | 'safe-water'
  | 'special'
  | 'emergency-wreck';

export type ToolMode = 'select' | 'pan' | 'pen' | 'erase' | 'note' | 'ship';

export type ViewMode = 'plan' | 'split' | 'vessel';

export type ShipType = 'own' | 'target' | 'tanker' | 'ferry';

export interface LightSegment {
  on: boolean;
  duration: number;
  /** When lit, optional colour for alternating characteristics (e.g. Al Oc BuY) */
  colour?: LightColour;
}

export interface BuoyDefinition {
  id: string;
  name: string;
  category: BuoyCategory;
  region?: IalaRegion | 'both';
  bodyColours: string[];
  topmark?: string;
  lightColour: LightColour;
  lightCharacteristic: string;
  periodSec: number;
  flashSequence: LightSegment[];
  description: string;
  svgDay: SvgMarkKey;
  svgNight: SvgMarkKey;
  /** Optional raster art under /buoyage/marks/ — falls back to SVG when missing */
  imageDay?: string;
  imageNight?: string;
}

export interface CanvasMark {
  id: string;
  definitionId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  label?: string;
  nightMode?: boolean | null;
  notes?: string;
  lightCharacteristicOverride?: string;
  zIndex: number;
}

export interface CanvasShip {
  id: string;
  x: number;
  y: number;
  /** Degrees, 0 = north (−Y on canvas), clockwise — also the bridge camera heading */
  rotation: number;
  scale: number;
  shipType: ShipType;
  label?: string;
  color: string;
  /** Horizontal FOV for vessel/horizon view (degrees) */
  fov: number;
  /** Current speed in world units / second */
  speed: number;
  /** Throttle −1…1 (astern … ahead) */
  throttle: number;
  /** Rudder −1…1 (port … starboard) */
  rudder: number;
  /** Persistent track history on the plan */
  track: { x: number; y: number }[];
  zIndex: number;
}

export interface CanvasPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  dashed: boolean;
  label?: string;
  zIndex: number;
}

export interface CanvasNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  zIndex: number;
}

/** Own-ship / observer camera placed on the plan view */
export interface CanvasViewpoint {
  id: string;
  x: number;
  y: number;
  /** Degrees, 0 = north (−Y on canvas), clockwise */
  heading: number;
  /** Horizontal field of view in degrees */
  fov: number;
  label?: string;
  zIndex: number;
}

export type ClipboardItem =
  | { type: 'mark'; data: CanvasMark }
  | { type: 'ship'; data: CanvasShip }
  | { type: 'path'; data: CanvasPath }
  | { type: 'note'; data: CanvasNote }
  | { type: 'viewpoint'; data: CanvasViewpoint };

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface BuoyageDocument {
  version: 2;
  region: IalaRegion;
  marks: CanvasMark[];
  ships: CanvasShip[];
  paths: CanvasPath[];
  notes: CanvasNote[];
  viewpoints: CanvasViewpoint[];
  /** @deprecated prefer activeShipId — kept for scene file compat */
  activeViewpointId: string | null;
  /** Ship whose bridge camera drives vessel view */
  activeShipId: string | null;
  camera: CameraState;
  nightMode: boolean;
  gridVisible: boolean;
  snapEnabled: boolean;
  viewMode: ViewMode;
}

export type SidebarCategory = {
  id: BuoyCategory | 'lateral' | string;
  label: string;
  definitionIds: string[];
};
