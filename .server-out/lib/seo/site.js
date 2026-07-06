"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OG_IMAGE = exports.DEFAULT_KEYWORDS = exports.DEFAULT_DESCRIPTION = exports.SITE_NAME = exports.SITE_URL = void 0;
exports.absoluteUrl = absoluteUrl;
/** Canonical site configuration — single source of truth for SEO URLs. */
exports.SITE_URL = 'https://cadetmate.co.uk';
exports.SITE_NAME = 'CadetMate';
exports.DEFAULT_DESCRIPTION = 'The training platform built for UK deck cadets. Interactive modules, COLREGS, watchkeeping, STCW revision and more.';
exports.DEFAULT_KEYWORDS = [
    'deck cadet training UK',
    'maritime cadet app',
    'STCW revision',
    'COLREGS training',
    'OOW cadet',
    'nautical science',
];
exports.DEFAULT_OG_IMAGE = '/images/CadetMateLogoBlueBGQWhiteFG.svg';
function absoluteUrl(path) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${exports.SITE_URL}${normalized}`;
}
