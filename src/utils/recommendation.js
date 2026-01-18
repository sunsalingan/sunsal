import { collection, getDocs } from '../lib/firebase';
import { db } from '../lib/firebase';

/**
 * Calculate similarity score between two users based on shared preferences.
 * 
 * Formula:
 * Score = (Common Wishlist Items * 3.0) + (Common Reviewed Places * 1.0)
 * 
 * @param {Array} userAWishlist - Array of place names or IDs from User A's wishlist
 * @param {Array} userBWishlist - Array of place names or IDs from User B's wishlist
 * @param {Array} userAReviews - Array of objects (or names) from User A's reviews
 * @param {Array} userBReviews - Array of objects (or names) from User B's reviews
 * @returns {number} Similarity Score
 */
export const calculateSimilarity = (userAWishlist, userBWishlist, userAReviews, userBReviews) => {
    // Normalize data to Sets of identifier strings (e.g., place names)
    // Assuming wishlist items are objects with 'name' or just strings? 
    // DataContext wishlist structure: { id, name, ... } usually.

    const getNames = (list) => {
        if (!list) return new Set();
        return new Set(list.map(item => item.name || item)); // Handle object or string
    };

    const wishA = getNames(userAWishlist);
    const wishB = getNames(userBWishlist);

    const reviewA = getNames(userAReviews);
    const reviewB = getNames(userBReviews);

    // 1. Calculate Wishlist Overlap
    let wishlistOverlap = 0;
    wishA.forEach(item => {
        if (wishB.has(item)) wishlistOverlap++;
    });

    // 2. Calculate Review Overlap
    let reviewOverlap = 0;
    reviewA.forEach(item => {
        if (reviewB.has(item)) reviewOverlap++;
    });

    // 3. Final Score
    const score = (wishlistOverlap * 3.0) + (reviewOverlap * 1.0);

    return {
        score,
        details: {
            wishlistCount: wishlistOverlap,
            reviewCount: reviewOverlap
        }
    };
};

/**
 * Get recommended users for the current user.
 * 
 * @param {Object} currentUser - The current user object (uid, etc.)
 * @param {Array} allUsers - List of all user objects
 * @param {Array} allReviews - List of all reviews (flattened)
 * @param {Function} fetchWishlistFn - Async function to fetch a user's wishlist (optional optimization)
 * @returns {Array} List of recommended users sorted by similarity score
 */
export const getRecommendedUsers = async (currentUser, allUsers, allReviews, followingList = []) => {
    if (!currentUser) return [];

    // 1. Prepare Current User Data
    const myReviews = allReviews.filter(r => r.userId === currentUser.uid);
    // Note: Wishlist for current user should be passed or fetched. 
    // Since this util might be called where we have the data, let's assume we fetch if needed 
    // OR we rely on what's passed. 
    // To make it robust without props hell, we might need to fetch subcollections here if not provided.
    // For MVP, let's do a fetch for candidates' wishlists as it's cleaner than passing everything.

    // Fetch My Wishlist
    const myWishlistSnap = await getDocs(collection(db, "users", currentUser.uid, "wishlist"));
    const myWishlist = myWishlistSnap.docs.map(d => d.data());

    const recommendations = [];

    // 2. Filter Candidates (Exclude Self and Already Followed)
    const followingSet = new Set(followingList);
    const candidates = allUsers.filter(u => u.id !== currentUser.uid && !followingSet.has(u.id));

    // Limit candidates for performance if scaling (e.g. random 20 or active users)
    // For now (<100 users), process all.

    // 3. Process Candidates
    // We need to fetch each candidate's wishlist. This is N queries. 
    // Optimization: Be careful. If 100 users => 100 reads. 
    // Acceptance: For MVP prototype with <50 users, this is acceptable. 
    // Future: Store 'wishlist_summary' in user doc.

    // Parallel fetch batching
    const BATCH_SIZE = 10;
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (candidate) => {
            try {
                // Fetch Candidate Wishlist
                const wishSnap = await getDocs(collection(db, "users", candidate.id, "wishlist"));
                const candidateWishlist = wishSnap.docs.map(d => d.data());

                // Filter Candidate Reviews from global list
                const candidateReviews = allReviews.filter(r => r.userId === candidate.id);

                // Calculate Similarity
                const { score, details } = calculateSimilarity(myWishlist, candidateWishlist, myReviews, candidateReviews);

                if (score > 0) {
                    recommendations.push({
                        ...candidate,
                        similarityScore: score,
                        similarityDetails: details
                    });
                }
            } catch (e) {
                console.error(`Error processing candidate ${candidate.id}`, e);
            }
        }));
    }

    // 4. Sort by Score DESC
    recommendations.sort((a, b) => b.similarityScore - a.similarityScore);

    // 5. Return Top Results
    return recommendations.slice(0, 10);
};
