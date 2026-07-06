'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCurrentUser = useCurrentUser;
exports.usePacks = usePacks;
exports.usePack = usePack;
exports.loadOwnership = loadOwnership;
exports.loadProgress = loadProgress;
exports.saveProgress = saveProgress;
exports.bumpPackStats = bumpPackStats;
exports.addXP = addXP;
exports.usePackStats = usePackStats;
exports.useUserXP = useUserXP;
// Data hooks for flashcard packs / cards / progress / xp.
// Drop into app/flashcards/lib/useFlashcards.ts
const react_1 = require("react");
const client_1 = require("@/lib/supabase/client");
const algorithms_1 = require("./algorithms");
const supabase = (0, client_1.createClient)();
function useCurrentUser() {
    const [userId, setUserId] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        supabase.auth.getUser().then(({ data }) => { var _a, _b; return setUserId((_b = (_a = data.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null); });
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { var _a, _b; return setUserId((_b = (_a = s === null || s === void 0 ? void 0 : s.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null); });
        return () => sub.subscription.unsubscribe();
    }, []);
    return userId;
}
function usePacks() {
    const [packs, setPacks] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        (async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('flashcard_packs').select('*')
                .eq('status', 'published').order('updated_at', { ascending: false });
            if (error)
                setError(error.message);
            else
                setPacks((data !== null && data !== void 0 ? data : []));
            setLoading(false);
        })();
    }, []);
    return { packs, loading, error };
}
function usePack(slug) {
    const [pack, setPack] = (0, react_1.useState)(null);
    const [cards, setCards] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!slug)
            return;
        (async () => {
            var _a, _b;
            setLoading(true);
            const { data: p, error: pe } = await supabase
                .from('flashcard_packs').select('*').eq('slug', slug).maybeSingle();
            if (pe || !p) {
                setError((_a = pe === null || pe === void 0 ? void 0 : pe.message) !== null && _a !== void 0 ? _a : 'Pack not found');
                setLoading(false);
                return;
            }
            setPack(p);
            let list = [];
            if (p.storage_path) {
                // Load card content from Storage JSON
                const { data: file } = await supabase.storage.from('flashcards').download(p.storage_path);
                if (file) {
                    const json = JSON.parse(await file.text());
                    list = ((_b = json.cards) !== null && _b !== void 0 ? _b : []).map((c, i) => {
                        var _a, _b, _c, _d, _f, _g, _h, _j;
                        return ({
                            id: (_a = c.id) !== null && _a !== void 0 ? _a : `${p.id}:${i}`,
                            pack_id: p.id,
                            position: (_b = c.position) !== null && _b !== void 0 ? _b : i,
                            card_type: (_c = c.card_type) !== null && _c !== void 0 ? _c : 'standard',
                            front: c.front,
                            back: c.back,
                            hint: (_d = c.hint) !== null && _d !== void 0 ? _d : null,
                            image_url: (_f = c.image_url) !== null && _f !== void 0 ? _f : null,
                            options: (_g = c.options) !== null && _g !== void 0 ? _g : null,
                            tags: (_h = c.tags) !== null && _h !== void 0 ? _h : [],
                            difficulty: (_j = c.difficulty) !== null && _j !== void 0 ? _j : 'beginner',
                        });
                    });
                }
            }
            else {
                const { data: rows } = await supabase
                    .from('flashcards').select('*').eq('pack_id', p.id).order('position');
                list = (rows !== null && rows !== void 0 ? rows : []);
            }
            // Expand "reverse" cards
            const expanded = [];
            for (const c of list) {
                expanded.push(c);
                if (c.card_type === 'reverse')
                    expanded.push(Object.assign(Object.assign({}, c), { id: c.id + ':rev', front: c.back, back: c.front, card_type: 'standard' }));
            }
            setCards(expanded);
            setLoading(false);
        })();
    }, [slug]);
    return { pack, cards, loading, error };
}
async function loadOwnership(userId, packId) {
    const { data } = await supabase
        .from('flashcard_pack_ownership').select('pack_id').eq('user_id', userId).eq('pack_id', packId).maybeSingle();
    return !!data;
}
async function loadProgress(userId, packId, cards) {
    const { data } = await supabase
        .from('flashcard_progress').select('*').eq('user_id', userId).eq('pack_id', packId);
    const map = new Map();
    (data !== null && data !== void 0 ? data : []).forEach((p) => map.set(p.card_id, p));
    return cards.map((c) => {
        var _a;
        const raw = (_a = map.get(c.id)) !== null && _a !== void 0 ? _a : (0, algorithms_1.initProgress)(c, userId);
        return { card: c, progress: (0, algorithms_1.applyForgettingCurve)(raw) };
    });
}
async function saveProgress(p) {
    // upsert (composite key user_id+card_id)
    await supabase.from('flashcard_progress').upsert(p, { onConflict: 'user_id,card_id' });
}
async function bumpPackStats(userId, packId, deltaSec, correct, total) {
    var _a, _b, _c, _d, _f, _g;
    const { data: cur } = await supabase
        .from('flashcard_pack_stats').select('*').eq('user_id', userId).eq('pack_id', packId).maybeSingle();
    const seen = ((_a = cur === null || cur === void 0 ? void 0 : cur.cards_seen) !== null && _a !== void 0 ? _a : 0) + total;
    const reviews = ((_b = cur === null || cur === void 0 ? void 0 : cur.reviews_completed) !== null && _b !== void 0 ? _b : 0) + total;
    const acc = reviews === 0 ? 0 : ((((_c = cur === null || cur === void 0 ? void 0 : cur.accuracy) !== null && _c !== void 0 ? _c : 0) * ((_d = cur === null || cur === void 0 ? void 0 : cur.reviews_completed) !== null && _d !== void 0 ? _d : 0)) + correct) / reviews;
    await supabase.from('flashcard_pack_stats').upsert({
        user_id: userId, pack_id: packId,
        cards_seen: seen,
        cards_mastered: (_f = cur === null || cur === void 0 ? void 0 : cur.cards_mastered) !== null && _f !== void 0 ? _f : 0,
        accuracy: Number(acc.toFixed(3)),
        time_spent_sec: ((_g = cur === null || cur === void 0 ? void 0 : cur.time_spent_sec) !== null && _g !== void 0 ? _g : 0) + deltaSec,
        reviews_completed: reviews,
        last_studied_at: new Date().toISOString(),
    }, { onConflict: 'user_id,pack_id' });
}
async function addXP(userId, gained, opts) {
    var _a, _b, _c, _d, _f, _g, _h, _j, _k;
    const reviews = (_a = opts === null || opts === void 0 ? void 0 : opts.reviews) !== null && _a !== void 0 ? _a : 0;
    const timeSec = (_b = opts === null || opts === void 0 ? void 0 : opts.timeSec) !== null && _b !== void 0 ? _b : 0;
    if (gained <= 0 && reviews <= 0 && timeSec <= 0)
        return null;
    const today = new Date().toISOString().slice(0, 10);
    const { data: cur } = await supabase.from('flashcard_user_xp').select('*').eq('user_id', userId).maybeSingle();
    const last = (cur === null || cur === void 0 ? void 0 : cur.last_study_day) ? new Date(cur.last_study_day) : null;
    const todayD = new Date(today);
    let streak = (_c = cur === null || cur === void 0 ? void 0 : cur.current_streak) !== null && _c !== void 0 ? _c : 0;
    if (reviews > 0 || gained > 0) {
        if (!last)
            streak = 1;
        else {
            const diff = Math.round((todayD.getTime() - last.getTime()) / 86400000);
            if (diff === 0)
                streak = streak || 1;
            else if (diff === 1)
                streak += 1;
            else
                streak = 1;
        }
    }
    const xp = ((_d = cur === null || cur === void 0 ? void 0 : cur.xp) !== null && _d !== void 0 ? _d : 0) + gained;
    const rank = (0, algorithms_1.rankForXP)(xp).current;
    const totalTime = ((_f = cur === null || cur === void 0 ? void 0 : cur.total_time_sec) !== null && _f !== void 0 ? _f : 0) + timeSec;
    await supabase.from('flashcard_user_xp').upsert({
        user_id: userId,
        xp,
        rank,
        current_streak: streak,
        longest_streak: Math.max((_g = cur === null || cur === void 0 ? void 0 : cur.longest_streak) !== null && _g !== void 0 ? _g : 0, streak),
        last_study_day: reviews > 0 || gained > 0 ? today : (_h = cur === null || cur === void 0 ? void 0 : cur.last_study_day) !== null && _h !== void 0 ? _h : today,
        total_time_sec: totalTime,
    }, { onConflict: 'user_id' });
    if (gained > 0 || reviews > 0) {
        const { data: dayRow } = await supabase
            .from('flashcard_study_days')
            .select('xp_earned, reviews')
            .eq('user_id', userId)
            .eq('day', today)
            .maybeSingle();
        await supabase.from('flashcard_study_days').upsert({
            user_id: userId,
            day: today,
            xp_earned: ((_j = dayRow === null || dayRow === void 0 ? void 0 : dayRow.xp_earned) !== null && _j !== void 0 ? _j : 0) + gained,
            reviews: ((_k = dayRow === null || dayRow === void 0 ? void 0 : dayRow.reviews) !== null && _k !== void 0 ? _k : 0) + reviews,
        }, { onConflict: 'user_id,day' });
    }
    return { xp, gained, rank, streak };
}
function usePackStats(userId, packId) {
    const [stats, setStats] = (0, react_1.useState)(null);
    const refresh = (0, react_1.useCallback)(async () => {
        if (!userId || !packId)
            return;
        const { data } = await supabase
            .from('flashcard_pack_stats').select('*').eq('user_id', userId).eq('pack_id', packId).maybeSingle();
        setStats((data !== null && data !== void 0 ? data : null));
    }, [userId, packId]);
    (0, react_1.useEffect)(() => { refresh(); }, [refresh]);
    return { stats, refresh };
}
function useUserXP(userId) {
    const [xp, setXP] = (0, react_1.useState)(null);
    const refresh = (0, react_1.useCallback)(async () => {
        if (!userId) {
            setXP(null);
            return;
        }
        const { data } = await supabase.from('flashcard_user_xp').select('*').eq('user_id', userId).maybeSingle();
        setXP((data !== null && data !== void 0 ? data : null));
    }, [userId]);
    (0, react_1.useEffect)(() => { refresh(); }, [refresh]);
    return { xp, refresh };
}
