# Avatar presets

Place profile photos here for the signup avatar picker.

## Expected files

The onboarding UI loads these presets (see `lib/onboarding/constants.ts`):

| File | Label |
|------|-------|
| `compass.svg` | Compass |
| `helm.svg` | Helm |
| `anchor.svg` | Anchor |
| `lighthouse.svg` | Lighthouse |
| `buoy.svg` | Buoy |
| `sextant.svg` | Sextant |
| `wave.svg` | Wave |
| `star.svg` | Star |

You can replace any file in place (SVG, PNG, or WebP). If you change filenames, update `AVATAR_PRESETS` in `lib/onboarding/constants.ts`.

Recommended size: **256×256** square images with a transparent or solid background.
