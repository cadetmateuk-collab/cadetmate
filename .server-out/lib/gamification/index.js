"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.awardXP = awardXP;
exports.levelFromXP = levelFromXP;
exports.getGamificationContext = getGamificationContext;
/**
 * Award XP and optionally create a notification for the user.
 * Gracefully no-ops if gamification tables are not yet migrated.
 */
async function awardXP(supabase, userId, amount, reason) {
    var _a;
    try {
        const { data: existing } = await supabase
            .from('user_gamification')
            .select('total_xp, level')
            .eq('user_id', userId)
            .maybeSingle();
        const newXp = ((_a = existing === null || existing === void 0 ? void 0 : existing.total_xp) !== null && _a !== void 0 ? _a : 0) + amount;
        const newLevel = Math.floor(newXp / 500) + 1;
        await supabase.from('user_gamification').upsert({
            user_id: userId,
            total_xp: newXp,
            level: newLevel,
            updated_at: new Date().toISOString(),
        });
        if (reason) {
            await supabase.from('notifications').insert({
                user_id: userId,
                type: 'xp_earned',
                title: `+${amount} XP earned`,
                body: reason,
                href: '/progress',
            });
        }
    }
    catch (_b) {
        // Tables may not exist yet — fail silently
    }
}
function levelFromXP(xp) {
    return Math.floor(xp / 500) + 1;
}
function getGamificationContext(role) {
    var _a;
    const r = (_a = role) !== null && _a !== void 0 ? _a : 'free';
    return {
        role: r,
        isPremium: r === 'premium' || r === 'admin',
    };
}
