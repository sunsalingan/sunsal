/**
 * AI Recommendation Logic
 * 
 * 1. Friend-based: Places highly rated by friends (>= 8.5) but not visited by me.
 * 2. Popularity: Global top rated places (fallback).
 */

export const getRecommendations = (user, allReviews, followingList) => {
    if (!user || !allReviews) return [];

    // 1. Get my visited places (normalization)
    const myReviews = allReviews.filter(r => r.userId === user.uid);
    const myVisitedNames = new Set(myReviews.map(r => r.name));

    // 2. Get Friends' High Rated Reviews
    // Friends list is array of UIDs.
    const friendReviews = allReviews.filter(r =>
        followingList.includes(r.userId) &&
        parseFloat(r.globalScore) >= 8.5
    );

    // 3. Aggregate Scores
    const placeMap = new Map(); // name -> { scoreSum, count, category, review }

    friendReviews.forEach(r => {
        if (myVisitedNames.has(r.name)) return; // Skip if I already visited

        if (!placeMap.has(r.name)) {
            placeMap.set(r.name, {
                name: r.name,
                category: r.category,
                location: r.address || r.location,
                scoreSum: 0,
                count: 0,
                recommenders: new Set(),
                sampleReview: r
            });
        }

        const data = placeMap.get(r.name);
        data.scoreSum += parseFloat(r.globalScore);
        data.count += 1;
        data.recommenders.add(r.userName);
    });

    // 4. Convert to List and Sort
    const recommendations = Array.from(placeMap.values()).map(p => ({
        id: `rec_${p.name}`,
        name: p.name,
        category: p.category,
        location: p.location,
        globalScore: (p.scoreSum / p.count).toFixed(1),
        friendScore: (p.scoreSum / p.count).toFixed(1), // Use friend avg as score
        recommenderCount: p.recommenders.size,
        recommenders: Array.from(p.recommenders),
        isRecommendation: true
    }));

    // Sort by count (popularity among friends) then score
    recommendations.sort((a, b) => {
        if (b.recommenderCount !== a.recommenderCount) {
            return b.recommenderCount - a.recommenderCount;
        }
        return b.friendScore - a.friendScore;
    });

    return recommendations.slice(0, 20); // Top 20
};
