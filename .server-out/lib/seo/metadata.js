"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPageMetadata = buildPageMetadata;
exports.buildArticleMetadata = buildArticleMetadata;
exports.buildNoIndexMetadata = buildNoIndexMetadata;
const site_1 = require("./site");
/** Build consistent page metadata with canonical URL, Open Graph, and Twitter tags. */
function buildPageMetadata({ title, description = site_1.DEFAULT_DESCRIPTION, path, keywords = [...site_1.DEFAULT_KEYWORDS], image = site_1.DEFAULT_OG_IMAGE, imageAlt = site_1.SITE_NAME, noIndex = false, openGraphType = 'website', publishedTime, modifiedTime, authors, section, }) {
    const url = (0, site_1.absoluteUrl)(path);
    const fullTitle = title.includes(site_1.SITE_NAME) ? title : `${title} | ${site_1.SITE_NAME}`;
    return Object.assign({ title,
        description,
        keywords, alternates: { canonical: url }, openGraph: Object.assign({ title: fullTitle, description,
            url, siteName: site_1.SITE_NAME, type: openGraphType, locale: 'en_GB', images: [{ url: image, alt: imageAlt }] }, (openGraphType === 'article' && {
            publishedTime,
            modifiedTime,
            authors,
            section,
        })), twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [image],
        } }, (noIndex && {
        robots: { index: false, follow: false },
    }));
}
/** Article-specific metadata with Open Graph article fields and canonical URL. */
function buildArticleMetadata({ title, description, path, image, author, date, updated_at, category, keywords, }) {
    const isoDate = new Date(date).toISOString();
    const isoModified = updated_at ? new Date(updated_at).toISOString() : isoDate;
    return buildPageMetadata({
        title,
        description,
        path,
        keywords,
        image: image !== null && image !== void 0 ? image : undefined,
        imageAlt: title,
        openGraphType: 'article',
        publishedTime: isoDate,
        modifiedTime: isoModified,
        authors: [author],
        section: category !== null && category !== void 0 ? category : 'Maritime Training',
    });
}
function buildNoIndexMetadata(title) {
    return buildPageMetadata({
        title,
        description: 'Private CadetMate area.',
        path: '/',
        noIndex: true,
    });
}
