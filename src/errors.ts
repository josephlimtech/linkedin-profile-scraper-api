export class SessionExpired extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionExpired';
    Error.captureStackTrace(this, SessionExpired)
  }
}
