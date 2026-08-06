'use client';

import type { ReactNode } from 'react';
import {
  DEFAULT_RADAR_SETTINGS,
  RADAR_RANGE_OPTIONS_NM,
  TRAIL_LENGTH_OPTIONS,
  formatRangeNm,
  type RadarDisplaySettings,
  type TrailLength,
  type TrailMode,
} from '@/lib/buoyage/radar-settings';

type Props = {
  settings: RadarDisplaySettings;
  onChange: (patch: Partial<RadarDisplaySettings>) => void;
  className?: string;
};

function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-md px-2 py-1 text-[10px] font-semibold touch-manipulation transition ${
        active
          ? 'bg-emerald-500/30 text-emerald-50 ring-1 ring-emerald-400/50'
          : 'bg-white/5 text-emerald-100/70 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Operator radar controls — range, rings, gain, heading line, trails.
 */
export function RadarControls({ settings, onChange, className }: Props) {
  return (
    <div
      className={`rounded-xl border border-emerald-500/20 bg-black/70 p-3 text-emerald-100 shadow-xl backdrop-blur-md ${className ?? ''}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/90">
          Radar controls
        </h2>
        <button
          type="button"
          className="text-[10px] text-emerald-200/50 hover:text-emerald-100 touch-manipulation"
          onClick={() => onChange({ ...DEFAULT_RADAR_SETTINGS })}
        >
          Reset
        </button>
      </div>

      <div className="space-y-3">
        <fieldset>
          <legend className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-200/55">
            Range (NM)
          </legend>
          <div className="flex flex-wrap gap-1">
            {RADAR_RANGE_OPTIONS_NM.map((nm) => (
              <Chip
                key={nm}
                active={settings.rangeNm === nm}
                onClick={() => onChange({ rangeNm: nm })}
              >
                {formatRangeNm(nm)}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-200/55">
            Range rings
          </legend>
          <div className="flex flex-wrap items-center gap-2">
            <Chip
              active={settings.showRangeRings}
              onClick={() => onChange({ showRangeRings: !settings.showRangeRings })}
            >
              {settings.showRangeRings ? 'On' : 'Off'}
            </Chip>
            {settings.showRangeRings && (
              <label className="flex flex-1 items-center gap-2 text-[10px] text-emerald-100/80">
                Count
                <input
                  type="range"
                  min={2}
                  max={6}
                  step={1}
                  value={settings.ringCount}
                  className="h-7 w-full accent-emerald-400 touch-manipulation"
                  onChange={(e) => onChange({ ringCount: Number(e.target.value) })}
                />
                <span className="w-4 tabular-nums">{settings.ringCount}</span>
              </label>
            )}
          </div>
        </fieldset>

        <label className="block text-[9px] font-semibold uppercase tracking-wide text-emerald-200/55">
          Gain
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={settings.gain}
            className="mt-1 h-7 w-full accent-emerald-400 touch-manipulation"
            onChange={(e) => onChange({ gain: Number(e.target.value) })}
          />
        </label>

        <label className="block text-[9px] font-semibold uppercase tracking-wide text-emerald-200/55">
          Noise / clutter
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={settings.noise}
            className="mt-1 h-7 w-full accent-emerald-400 touch-manipulation"
            onChange={(e) => onChange({ noise: Number(e.target.value) })}
          />
        </label>

        <fieldset>
          <legend className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-200/55">
            Heading line
          </legend>
          <div className="flex flex-wrap items-center gap-2">
            <Chip
              active={settings.headingLine}
              onClick={() => onChange({ headingLine: !settings.headingLine })}
            >
              {settings.headingLine ? 'On' : 'Off'}
            </Chip>
            {settings.headingLine && (
              <label className="flex flex-1 items-center gap-2 text-[10px] text-emerald-100/80">
                Length
                <input
                  type="range"
                  min={0.25}
                  max={1}
                  step={0.05}
                  value={settings.headingLineLength}
                  className="h-7 w-full accent-emerald-400 touch-manipulation"
                  onChange={(e) => onChange({ headingLineLength: Number(e.target.value) })}
                />
              </label>
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-200/55">
            Trail length
          </legend>
          <div className="flex flex-wrap gap-1">
            {TRAIL_LENGTH_OPTIONS.map((opt) => (
              <Chip
                key={opt.id}
                active={settings.trailLength === opt.id}
                onClick={() => onChange({ trailLength: opt.id as TrailLength })}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        {settings.trailLength !== 'off' && (
          <fieldset>
            <legend className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-200/55">
              Trail mode
            </legend>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'relative', label: 'Relative' },
                  { id: 'true', label: 'True' },
                  { id: 'both', label: 'Both' },
                ] as { id: TrailMode; label: string }[]
              ).map((opt) => (
                <Chip
                  key={opt.id}
                  active={settings.trailMode === opt.id}
                  onClick={() => onChange({ trailMode: opt.id })}
                  title={
                    opt.id === 'relative'
                      ? 'Relative-motion trails (targets as seen from own ship)'
                      : opt.id === 'true'
                        ? 'True-motion trails (ground track)'
                        : 'Show relative and true trails'
                  }
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </fieldset>
        )}
      </div>
    </div>
  );
}
