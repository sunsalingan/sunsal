import { db } from "../lib/firebase";
import { collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";

export const resetAndSeedData = async () => {
    if (!window.confirm("정말로 모든 데이터를 삭제하고 '순살' 더미 데이터로 초기화하시겠습니까? (되돌릴 수 없습니다!)")) return;

    console.log("Starting data reset...");

    try {
        // 1. Delete all existing reviews
        const reviewsSnapshot = await getDocs(collection(db, "reviews"));
        const deleteReviewPromises = reviewsSnapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deleteReviewPromises);
        console.log(`Deleted ${deleteReviewPromises.length} reviews.`);

        // 2. Delete all existing users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const deleteUserPromises = usersSnapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deleteUserPromises);
        console.log(`Deleted ${deleteUserPromises.length} users.`);

        // 3. Create new dummy users (순살1 ~ 순살5)
        const dummyUsers = [];
        for (let i = 1; i <= 5; i++) {
            dummyUsers.push({
                uid: `soonsal_user_${i}`,
                name: `순살${i}`,
                email: `soonsal${i}@example.com`,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=Soonsal${i}`,
                createdAt: serverTimestamp()
            });
        }

        for (const user of dummyUsers) {
            await setDoc(doc(db, "users", user.uid), user);
        }
        console.log("Created 5 dummy users.");

        // 4. Create dummy reviews
        const locations = [
            { name: "교촌치킨 강남점", lat: 37.4979, lng: 127.0276, category: "치킨" },
            { name: "스타벅스 역삼점", lat: 37.5006, lng: 127.0365, category: "카페" },
            { name: "우래옥 본점", lat: 37.5682, lng: 126.9987, category: "한식" },
            { name: "몽탄", lat: 37.5318, lng: 126.9715, category: "고기" },
            { name: "다운타우너 한남", lat: 37.5358, lng: 127.0019, category: "버거" },
            { name: "랜디스도넛 연남", lat: 37.5626, lng: 126.9256, category: "디저트" },
            { name: "명동교자", lat: 37.5625, lng: 126.9856, category: "한식" },
            { name: "을지면옥", lat: 37.5663, lng: 126.9922, category: "한식" },
            { name: "블루보틀 성수", lat: 37.5480, lng: 127.0450, category: "카페" },
            { name: "쉐이크쉑 강남", lat: 37.5026, lng: 127.0257, category: "버거" }
        ];

        const comments = [
            "진짜 인생 맛집입니다!",
            "웨이팅이 좀 길지만 기다릴만 해요.",
            "사장님이 친절하고 양이 푸짐합니다.",
            "분위기가 깡패네요. 데이트 코스로 추천!",
            "맛은 있는데 가격이 좀 비싸요.",
            "친구들이랑 가기 딱 좋은 곳.",
            "재방문 의사 있습니다.",
            "솔직히 기대 이하였어요 ㅠㅠ",
            "비주얼 굿! 인스타 감성 낭낭합니다.",
            "평범하지만 깔끔해요."
        ];

        let reviewCount = 0;
        for (const user of dummyUsers) {
            // Each user writes 3-6 reviews
            const numReviews = Math.floor(Math.random() * 4) + 3;
            for (let j = 0; j < numReviews; j++) {
                const place = locations[Math.floor(Math.random() * locations.length)];
                const comment = comments[Math.floor(Math.random() * comments.length)];
                const score = (Math.random() * 2 + 8).toFixed(1); // 8.0 ~ 10.0

                // Create a reasonably unique ID
                const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                await setDoc(doc(db, "reviews", reviewId), {
                    userId: user.uid,
                    userName: user.name,
                    userPhoto: user.photoURL,
                    name: place.name,
                    category: place.category,
                    lat: place.lat + (Math.random() * 0.002 - 0.001), // Jitter location slightly
                    lng: place.lng + (Math.random() * 0.002 - 0.001),
                    address: "서울 어딘가",
                    comment: comment,
                    globalScore: score,
                    rankIndex: j, // Personal rank
                    timestamp: serverTimestamp()
                });
                reviewCount++;
            }
        }
        console.log(`Created ${reviewCount} dummy reviews.`);

        // 5. Create Follows (Loop)
        // 순살1 -> 순살2, 3
        // 순살2 -> 순살1, 3, 4
        const user1 = dummyUsers[0];
        const user2 = dummyUsers[1];
        const user3 = dummyUsers[2];

        await setDoc(doc(db, "users", user1.uid, "following", user2.uid), {});
        await setDoc(doc(db, "users", user1.uid, "following", user3.uid), {});

        await setDoc(doc(db, "users", user2.uid, "following", user1.uid), {});
        await setDoc(doc(db, "users", user2.uid, "following", user3.uid), {});

        console.log("Created follow relationships.");

        alert("데이터 초기화 완료! 페이지를 새로고침하면 적용됩니다.");
        window.location.reload();

    } catch (e) {
        console.error("Error seeding data:", e);
        alert("데이터 초기화 중 오류가 발생했습니다: " + e.message);
    }
};
