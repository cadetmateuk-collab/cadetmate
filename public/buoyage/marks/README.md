# Buoy mark assets

Day art under this folder. Prefer `{definitionId}.day.png` when adding new files.

Some existing files use non-standard names (mapped in `lib/buoyage/assets.ts`):

| File | Definition id(s) |
|------|------------------|
| `cardinal-*.day.png` | `cardinal-north/east/south/west` |
| `isolate-danger.png` | `isolated-danger` |
| `safe-water.png` | `safe-water` |
| `special-mark.png` | `special-mark` |
| `emergency-wreck.png` | `emergency-wreck` |
| `prefered-channel-to-port-{cone,pillar,spar}.png` | Region A preferred-to-port (B reuses opposite) |
| `prefered-channel-to-starboard-{can,pillar,spar}.png` | Region A preferred-to-starboard (B reuses opposite) |

**Laterals (can/cone/pillar/spar):** no PNGs yet — procedural SVG is used. Drop files named like `lateral-port-can-a.day.png` and add them to `MARK_DAY_IMAGES` when ready.

Definition metadata lives in `data/buoyage/definitions/`.
