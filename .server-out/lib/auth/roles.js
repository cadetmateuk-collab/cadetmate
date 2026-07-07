"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPremiumRole = isPremiumRole;
exports.isAdminRole = isAdminRole;
exports.getAccessLevel = getAccessLevel;
function isPremiumRole(role) {
    return role === 'premium' || role === 'admin';
}
function isAdminRole(role) {
    return role === 'admin';
}
function getAccessLevel(role) {
    if (role === 'admin')
        return 'admin';
    if (isPremiumRole(role))
        return 'premium';
    return 'free';
}
