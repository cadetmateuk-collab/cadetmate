"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNavUser = toNavUser;
function toNavUser(user) {
    var _a, _b, _c, _d, _e;
    const name = ((_a = user.profile) === null || _a === void 0 ? void 0 : _a.full_name) ||
        ((_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.full_name) ||
        ((_c = user.email) === null || _c === void 0 ? void 0 : _c.split('@')[0]) ||
        'User';
    return {
        name,
        email: ((_d = user.profile) === null || _d === void 0 ? void 0 : _d.email) || user.email || '',
        initials: name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
        role: ((_e = user.profile) === null || _e === void 0 ? void 0 : _e.role) || 'free',
    };
}
