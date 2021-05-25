"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionExpired = void 0;
class SessionExpired extends Error {
    constructor(message) {
        super(message);
        this.name = 'SessionExpired';
        Error.captureStackTrace(this, SessionExpired);
    }
}
exports.SessionExpired = SessionExpired;
//# sourceMappingURL=errors.js.map