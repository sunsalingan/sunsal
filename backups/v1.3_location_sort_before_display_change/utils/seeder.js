import { db } from "../lib/firebase";
import { collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from "../lib/firebase";

export const resetAndSeedData = async () => {
    if (!window.confirm("정말로 모든 데이터를 삭제하고 '순살' 더미 데이터로 초기화하시겠습니까? (되돌릴 수 없습니다!)")) return;

    console.log("Starting data reset...");

    try {
        // 1. Delete all existing reviews and users (Parallel)
        const [reviewsSnapshot, usersSnapshot] = await Promise.all([
            getDocs(collection(db, "reviews")),
            getDocs(collection(db, "users"))
        ]);

        const deletePromises = [
            ...reviewsSnapshot.docs.map(d => deleteDoc(d.ref)),
            ...usersSnapshot.docs.map(d => deleteDoc(d.ref))
        ];

        // Batch delete to avoid timeout if possible, but for 1000 items simple Promise.all is okay for now or chunking
        // Simple chunking for safety
        const chunkSize = 500;
        for (let i = 0; i < deletePromises.length; i += chunkSize) {
            await Promise.all(deletePromises.slice(i, i + chunkSize));
        }
        console.log(`Deleted ${deletePromises.length} documents.`);

        // 2. Import Mock Data
        const { MOCK_PLACES_DB } = await import("../data/mock");

        // 3. Create 10 dummy users
        const dummyUsers = [];
        for (let i = 1; i <= 10; i++) {
            dummyUsers.push({
                uid: `soonsal_user_${i}`,
                name: `순살${i}`,
                email: `soonsal${i}@example.com`,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=Soonsal${i}`,
                createdAt: serverTimestamp()
            });
        }

        await Promise.all(dummyUsers.map(u => setDoc(doc(db, "users", u.uid), u)));
        console.log("Created 10 dummy users.");

        // 4. Create ~1000 dummy reviews (100 per user)
        const comments = [
            "진짜 인생 맛집입니다!", "웨이팅이 좀 길지만 기다릴만 해요.", "사장님이 친절하고 양이 푸짐합니다.",
            "분위기가 깡패네요. 데이트 코스로 추천!", "맛은 있는데 가격이 좀 비싸요.", "친구들이랑 가기 딱 좋은 곳.",
            "재방문 의사 있습니다.", "솔직히 기대 이하였어요 ㅠㅠ", "비주얼 굿! 인스타 감성 낭낭합니다.",
            "평범하지만 깔끔해요.", "부모님 모리고 오기 좋아요.", "역시 본점은 다르네요.",
            "숨겨진 맛집 발견!", "나만 알고 싶은 곳인데...", "주말엔 사람 너무 많아요."
        ];

        let reviewCount = 0;
        const reviewPromises = [];

        for (const user of dummyUsers) {
            // Shuffle locations to ensure random selection
            const shuffledPlaces = [...MOCK_PLACES_DB].sort(() => 0.5 - Math.random());

            // Ensure uniqueness: Slice distinct items from the shuffled mock DB
            const targetCount = Math.min(50, MOCK_PLACES_DB.length);
            const placesForUser = shuffledPlaces.slice(0, targetCount);

            // Normal Distribution Logic for Scores
            // We want a mix. Let's start with user's personal ranking.
            // index 0 = Rank 1 (Top). index 99 = Rank 100.

            // Calculate Global Score (Stored for visualization, though app recalculates)
            // But we simply store the rank.

            for (let j = 0; j < placesForUser.length; j++) {
                const place = placesForUser[j];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                // Score is derived from Rank in App, but let's store a static one for seeding consistency
                // Top ranks get ~9.5, Low ranks get ~6.0
                const score = (10 - (j / targetCount) * 4).toFixed(1); // 10.0 down to 6.0 linear approx

                const reviewId = `review_${user.uid}_${Date.now()}_${j}`;

                reviewPromises.push(setDoc(doc(db, "reviews", reviewId), {
                    userId: user.uid,
                    userName: user.name,
                    userPhoto: user.photoURL,
                    name: place.name,
                    category: place.category,
                    lat: place.lat,
                    lng: place.lng,
                    address: place.address || "서울 어딘가",
                    comment: comment,
                    globalScore: score,
                    rankIndex: j, // 0 to 99
                    timestamp: serverTimestamp()
                }));
                reviewCount++;
            }
        }

        // Chunk writes
        for (let i = 0; i < reviewPromises.length; i += chunkSize) {
            await Promise.all(reviewPromises.slice(i, i + chunkSize));
        }
        console.log(`Created ${reviewCount} dummy reviews.`);

        // 5. Create Follows (Random Network)
        const followPromises = [];
        for (const u1 of dummyUsers) {
            // Follow 3-5 random others
            const targets = dummyUsers.filter(u => u.uid !== u1.uid).sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2);
            for (const u2 of targets) {
                followPromises.push(setDoc(doc(db, "users", u1.uid, "following", u2.uid), {}));
            }
        }
        await Promise.all(followPromises);
        console.log("Created follow relationships.");

        alert("데이터 초기화 완료! (사용자 10명, 리뷰 1000개)");
        window.location.reload();

    } catch (e) {
        console.error("Error seeding data:", e);
        alert("데이터 초기화 중 오류가 발생했습니다: " + e.message);
    }
};
