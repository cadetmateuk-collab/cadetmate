"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPageMetadata = buildPageMetadata;
exports.buildNoIndexMetadata = buildNoIndexMetadata;
const site_1 = require("./site");
/** Build consistent page metadata with canonical URL, Open Graph, and Twitter tags. */
function buildPageMetadata({ title, description = site_1.DEFAULT_DESCRIPTION, path, keywords = [...site_1.DEFAULT_KEYWORDS], image = site_1.DEFAULT_OG_IMAGE, imageAlt = site_1.SITE_NAME, noIndex = false, }) {
    const url = (0, site_1.absoluteUrl)(path);
    const fullTitle = title.includes(site_1.SITE_NAME) ? title : `${title} | ${site_1.SITE_NAME}`;
    return Object.assign({ title,
        description,
        keywords, alternates: { canonical: url }, openGraph: {
            title: fullTitle,
            description,
            url,
            siteName: site_1.SITE_NAME,
            type: 'website',
            locale: 'en_GB',
            images: [{ url: image, alt: imageAlt }],
        }, twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [image],
        } }, (noIndex && {
        robots: { index: false, follow: false },
    }));
}
function buildNoIndexMetadata(title) {
    return buildPageMetadata({
        title,
        description: 'Private CadetMate area.',
        path: '/',
        noIndex: true,
    });
}
