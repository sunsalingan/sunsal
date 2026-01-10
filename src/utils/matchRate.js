/**
 * Calculates a deterministic match rate between two users.
 * Currently uses a simple hash of user IDs to generate a stable number.
 * 
 * @param {string} currentUserId - The ID of the current logged-in user.
 * @param {string} targetUserId - The ID of the target user.
 * @returns {number} A integer between 80 and 99.
 */
export function getMatchRate(currentUserId, targetUserId) {
    if (!currentUserId || !targetUserId) return 0;
    if (currentUserId === targetUserId) return 100;

    // specific case for demo purposes? No, just hash.
    const combined = currentUserId < targetUserId ? currentUserId + targetUserId : targetUserId + currentUserId; // Normalize order
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Normalize to range 80 ~ 99
    const stableRandom = Math.abs(hash) % 20;
    return 80 + stableRandom;
}
