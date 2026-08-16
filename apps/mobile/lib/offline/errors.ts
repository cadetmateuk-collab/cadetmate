export class OfflineModeError extends Error {
  constructor(message = 'Offline Mode is on. The app will not use the internet.') {
    super(message);
    this.name = 'OfflineModeError';
  }
}

export function isOfflineModeError(err: unknown): err is OfflineModeError {
  return err instanceof OfflineModeError || (err instanceof Error && err.name === 'OfflineModeError');
}
