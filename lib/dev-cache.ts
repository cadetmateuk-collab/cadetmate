/**
 * Temporary kill-switches while developing.
 * Flip these back when you say “redo cache” / re-enable HMR / manifest.
 */
export const ENABLE_DATA_CACHE = false;
/** Next Fast Refresh websockets — leave off (custom server + HMR was causing reload loops). */
export const ENABLE_HMR = false;
/** Web app manifest route — off (stops /manifest.webmanifest spam). */
export const ENABLE_WEB_MANIFEST = false;

export const REVALIDATE_SECONDS = ENABLE_DATA_CACHE
  ? process.env.NODE_ENV === 'development'
    ? 120
    : 300
  : 0;
