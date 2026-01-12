/**
 * Score Calculator derived from Rank Index using Normal Distribution
 */

/**
 * Approximate Inverse Error Function (erfinv)
 * Used to calculate Probit function (Inverse Cumulative Normal Distribution)
 */
function erfinv(x) {
    const a = 0.147;
    const sign = x < 0 ? -1 : 1;
    const ln_1_x2 = Math.log(1 - x * x);
    const term1 = 2 / (Math.PI * a) + ln_1_x2 / 2;
    const term2 = ln_1_x2 / a;

    return sign * Math.sqrt(Math.sqrt(term1 * term1 - term2) - term1);
}

/**
 * Calculates Z-Score from percentile (0 to 1)
 * Uses approximation of probit function
 */
function normSInv(p) {
    // Handling edges to avoid Infinity
    if (p <= 0) p = 0.001;
    if (p >= 1) p = 0.999;

    // Probit(p) = sqrt(2) * erfinv(2p - 1)
    return Math.sqrt(2) * erfinv(2 * p - 1);
}

/**
 * Recalculates scores for a list of reviews based on their rankIndex.
 * 
 * Logic:
 * 1. Sort reviews by rankIndex.
 * 2. Calculate Percentile for each rank.
 * 3. Map Percentile to Z-Score (Normal Distribution).
 * 4. Map Z-Score to 0.0 ~ 10.0 scale (Mean=5.0, SD=1.6 roughly).
 * 
 * @param {Array} reviews - List of review objects (must contain id, rankIndex)
 * @returns {Array} - List of reviews with updated 'globalScore'
 */
export const calculateScores = (reviews) => {
    if (!reviews || reviews.length === 0) return [];

    // 1. Sort by Rank (Ascending: 0 is best)
    const sorted = [...reviews].sort((a, b) => (a.rankIndex || 0) - (b.rankIndex || 0));

    const N = sorted.length;

    // Edge Case: Single item -> 10.0 points
    if (N === 1) {
        return [{ ...sorted[0], globalScore: "10.0" }];
    }

    // 2. Calculate Raw Z-Scores using Quantiles
    // We use (i + 0.5) / N to avoid 0 or 1 (Infinity)
    // i=0 (Rank 1, Best) -> needs highest Z.
    // So we use P = (N - i - 0.5) / N
    const zScores = sorted.map((_, i) => {
        const p = (N - i - 0.5) / N;
        return normSInv(p);
    });

    // 3. Scale Z-Scores to [1.0, 10.0]
    // Top (i=0) should be 10.0
    // Bottom (i=N-1) should be 1.0
    const maxZ = zScores[0];
    const minZ = zScores[N - 1];

    let range = maxZ - minZ;
    // Safety check for tiny range (unlikely with N > 1)
    if (range < 0.000001) range = 1;

    return sorted.map((review, i) => {
        const z = zScores[i];

        // Linear Interpolation: 
        // Score = MinScore + (Z - MinZ) * ( (MaxScore - MinScore) / Range )
        // MinScore = 1.0, MaxScore = 10.0
        let score = 1.0 + (z - minZ) * (9.0 / range);

        return {
            ...review,
            globalScore: score.toFixed(1)
        };
    });
};
