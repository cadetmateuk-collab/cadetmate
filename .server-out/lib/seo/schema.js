"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOrganizationSchema = buildOrganizationSchema;
exports.buildBreadcrumbSchema = buildBreadcrumbSchema;
exports.buildArticleSchema = buildArticleSchema;
exports.buildFAQSchema = buildFAQSchema;
exports.buildCollectionPageSchema = buildCollectionPageSchema;
const site_1 = require("./site");
const paths_1 = require("@/lib/blog/paths");
function buildOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: site_1.SITE_NAME,
        url: site_1.SITE_URL,
        logo: (0, site_1.absoluteUrl)(site_1.DEFAULT_OG_IMAGE),
        description: 'CadetMate is a maritime training platform built for UK deck cadets, offering interactive modules, revision tools, and free educational content.',
        sameAs: [],
    };
}
function buildBreadcrumbSchema(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: (0, site_1.absoluteUrl)(item.path),
        })),
    };
}
function buildArticleSchema(post) {
    var _a, _b;
    const url = (0, site_1.absoluteUrl)((0, paths_1.buildBlogPostPath)(post));
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        image: post.image ? [post.image] : [(0, site_1.absoluteUrl)(site_1.DEFAULT_OG_IMAGE)],
        datePublished: post.date,
        dateModified: (_a = post.updated_at) !== null && _a !== void 0 ? _a : post.date,
        author: {
            '@type': 'Person',
            name: post.author,
        },
        publisher: {
            '@type': 'Organization',
            name: site_1.SITE_NAME,
            logo: {
                '@type': 'ImageObject',
                url: (0, site_1.absoluteUrl)(site_1.DEFAULT_OG_IMAGE),
            },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        url,
        articleSection: (_b = post.category) !== null && _b !== void 0 ? _b : 'Maritime Training',
        inLanguage: 'en-GB',
    };
}
function buildFAQSchema(faqs) {
    if (faqs.length === 0)
        return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}
function buildCollectionPageSchema(options) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: options.name,
        description: options.description,
        url: (0, site_1.absoluteUrl)(options.path),
        isPartOf: { '@type': 'WebSite', name: site_1.SITE_NAME, url: site_1.SITE_URL },
        hasPart: options.items.map((item) => ({
            '@type': 'Article',
            name: item.name,
            url: item.url,
        })),
    };
}
