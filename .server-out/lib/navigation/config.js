"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOBILE_BOTTOM_NAV = exports.APP_NAV_GROUPS = exports.PUBLIC_AUTH_NAV = exports.PUBLIC_NAV = void 0;
exports.isNavItemActive = isNavItemActive;
exports.isGroupActive = isGroupActive;
exports.filterNavForUser = filterNavForUser;
const lucide_react_1 = require("lucide-react");
/** Public marketing site navigation */
exports.PUBLIC_NAV = [
    { id: 'home', label: 'Home', href: '/home', icon: lucide_react_1.Home },
    { id: 'blog', label: 'Blog', href: '/free-content', icon: lucide_react_1.Newspaper },
    { id: 'resources', label: 'Free Resources', href: '/resources', icon: lucide_react_1.BookOpen },
    { id: 'community', label: 'Community', href: '/community-preview', icon: lucide_react_1.MessageSquare },
    { id: 'pricing', label: 'Pricing', href: '/pricing', icon: lucide_react_1.DollarSign },
    { id: 'about', label: 'About', href: '/about', icon: lucide_react_1.Info },
    { id: 'contact', label: 'Contact', href: '/contact', icon: lucide_react_1.Mail },
];
exports.PUBLIC_AUTH_NAV = [
    { id: 'login', label: 'Log In', href: '/auth', icon: lucide_react_1.LogIn },
    { id: 'signup', label: 'Sign Up', href: '/auth?mode=signup', icon: lucide_react_1.Sparkles },
];
/** Logged-in application sidebar */
exports.APP_NAV_GROUPS = [
    {
        id: 'main',
        label: 'Main',
        defaultOpen: true,
        items: [
            { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: lucide_react_1.LayoutDashboard, exact: true },
        ],
    },
    {
        id: 'learn',
        label: 'Learn',
        defaultOpen: true,
        items: [
            { id: 'flashcards', label: 'Flashcards', href: '/flashcards', icon: lucide_react_1.WalletCards, premiumOnly: true },
            { id: 'modules', label: 'Learning Modules', href: '/unit-modules', icon: lucide_react_1.BookOpen, premiumOnly: true },
            { id: 'trb', label: 'TRB', href: '/trb', icon: lucide_react_1.FileText, premiumOnly: true },
            { id: 'sea-survival', label: 'Sea Survival', href: '/sea-survival', icon: lucide_react_1.Anchor, premiumOnly: true },
            { id: 'colregs', label: 'COLREGs', href: '/unit-modules?category=colregs', icon: lucide_react_1.Compass },
            { id: 'navigation', label: 'Navigation', href: '/unit-modules?category=navigation', icon: lucide_react_1.Navigation },
            { id: 'meteorology', label: 'Meteorology', href: '/unit-modules?category=meteorology', icon: lucide_react_1.Cloud },
            { id: 'cargo', label: 'Cargo', href: '/unit-modules?category=cargo', icon: lucide_react_1.Package },
            { id: 'learn-hub', label: 'Search All Learning', href: '/learn', icon: lucide_react_1.Search },
        ],
    },
    {
        id: 'practice',
        label: 'Practice',
        items: [
            { id: 'mock-oral', label: 'Mock Oral Exams', href: '/practice?tab=mock-oral', icon: lucide_react_1.Mic, premiumOnly: true },
            { id: 'oral-questions', label: 'Oral Questions', href: '/practice?tab=oral-questions', icon: lucide_react_1.HelpCircle, premiumOnly: true },
            { id: 'simulators', label: 'Emergency Simulators', href: '/simulator', icon: lucide_react_1.Zap, premiumOnly: true },
            { id: 'quick-quiz', label: 'Quick Quiz', href: '/practice?tab=quick-quiz', icon: lucide_react_1.Target },
            { id: 'scenarios', label: 'Scenario Challenges', href: '/practice?tab=scenarios', icon: lucide_react_1.GraduationCap, premiumOnly: true },
            { id: 'practice-hub', label: 'All Practice', href: '/practice', icon: lucide_react_1.PenLine },
        ],
    },
    {
        id: 'community',
        label: 'Community',
        items: [
            { id: 'feed', label: 'Feed', href: '/community', icon: lucide_react_1.MessageSquare, exact: true },
            { id: 'latest', label: 'Latest', href: '/community?sort=new', icon: lucide_react_1.Sparkles },
            { id: 'popular', label: 'Popular', href: '/community?sort=top', icon: lucide_react_1.TrendingUp },
            { id: 'my-posts', label: 'My Posts', href: '/community?filter=mine', icon: lucide_react_1.User },
            { id: 'saved', label: 'Saved', href: '/community?filter=saved', icon: lucide_react_1.Bookmark },
            { id: 'leaderboard', label: 'Leaderboard', href: '/community?tab=leaderboard', icon: lucide_react_1.Trophy },
        ],
    },
    {
        id: 'progress',
        label: 'Progress',
        items: [
            { id: 'progress-dashboard', label: 'Dashboard', href: '/progress', icon: lucide_react_1.BarChart3, exact: true },
            { id: 'statistics', label: 'Statistics', href: '/progress?tab=statistics', icon: lucide_react_1.TrendingUp },
            { id: 'streak', label: 'Study Streak', href: '/progress?tab=streak', icon: lucide_react_1.Flame },
            { id: 'achievements', label: 'Achievements', href: '/progress?tab=achievements', icon: lucide_react_1.Trophy },
            { id: 'completed', label: 'Completed Modules', href: '/progress?tab=completed', icon: lucide_react_1.GraduationCap },
            { id: 'quiz-history', label: 'Quiz History', href: '/progress?tab=quizzes', icon: lucide_react_1.History },
            { id: 'exam-readiness', label: 'Exam Readiness', href: '/progress?tab=readiness', icon: lucide_react_1.Target },
        ],
    },
    {
        id: 'store',
        label: 'Store',
        items: [
            { id: 'store', label: 'Store', href: '/store', icon: lucide_react_1.ShoppingBag },
        ],
    },
    {
        id: 'profile',
        label: 'Profile',
        items: [
            { id: 'account', label: 'Account', href: '/profile', icon: lucide_react_1.User, exact: true },
            { id: 'subscription', label: 'Subscription', href: '/profile?tab=subscription', icon: lucide_react_1.Sparkles },
            { id: 'billing', label: 'Billing', href: '/profile?tab=billing', icon: lucide_react_1.CreditCard },
            { id: 'notifications', label: 'Notifications', href: '/profile?tab=notifications', icon: lucide_react_1.Bell },
            { id: 'settings', label: 'Settings', href: '/settings', icon: lucide_react_1.Settings },
        ],
    },
    {
        id: 'admin',
        label: 'Admin',
        adminOnly: true,
        items: [
            { id: 'admin-home', label: 'Admin Home', href: '/admin/admin-home', icon: lucide_react_1.Shield },
            { id: 'admin-modules', label: 'Module Management', href: '/admin/modules', icon: lucide_react_1.BookOpen },
            { id: 'admin-builder', label: 'Module Builder', href: '/admin/module-builder', icon: lucide_react_1.PenLine },
            { id: 'admin-content', label: 'Content Manager', href: '/admin/free-content-manager', icon: lucide_react_1.FileText },
        ],
    },
];
/** Mobile bottom navigation for logged-in app */
exports.MOBILE_BOTTOM_NAV = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: lucide_react_1.LayoutDashboard },
    { id: 'learn', label: 'Learn', href: '/learn', icon: lucide_react_1.BookOpen },
    { id: 'practice', label: 'Practice', href: '/practice', icon: lucide_react_1.Target },
    { id: 'community', label: 'Community', href: '/community', icon: lucide_react_1.Users },
    { id: 'profile', label: 'Profile', href: '/profile', icon: lucide_react_1.User },
];
function isNavItemActive(pathname, href, exact) {
    const [path, query] = href.split('?');
    if (exact)
        return pathname === path;
    if (!pathname.startsWith(path))
        return false;
    if (!query)
        return true;
    // Query-aware matching is handled client-side in the sidebar; on server, path match is enough
    return true;
}
function isGroupActive(pathname, items) {
    return items.some((item) => {
        const path = item.href.split('?')[0];
        return pathname === path || pathname.startsWith(path + '/');
    });
}
function filterNavForUser(groups, role) {
    const isAdmin = role === 'admin';
    return groups
        .filter((g) => !g.adminOnly || isAdmin)
        .map((g) => (Object.assign(Object.assign({}, g), { items: g.items.filter((item) => !item.adminOnly || isAdmin) })))
        .filter((g) => g.items.length > 0);
}
