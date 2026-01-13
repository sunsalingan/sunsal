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

        // Specific Franchise Data for Ranking Test
        const franchiseData = {
            "버거킹": [
                { name: "버거킹 강남교보점", lat: 37.5038, lng: 127.0242, address: "서울 서초구" },
                { name: "버거킹 종로점", lat: 37.5704, lng: 126.9830, address: "서울 종로구" },
                { name: "버거킹 홍대역점", lat: 37.5567, lng: 126.9237, address: "서울 마포구" },
                { name: "버거킹 여의도점", lat: 37.5218, lng: 126.9242, address: "서울 영등포구" },
                { name: "버거킹 잠실점", lat: 37.5133, lng: 127.1001, address: "서울 송파구" },
            ],
            "롯데리아": [
                { name: "롯데리아 서울역점", lat: 37.5550, lng: 126.9708, address: "서울 중구" },
                { name: "롯데리아 홍대점", lat: 37.5560, lng: 126.9230, address: "서울 마포구" },
                { name: "롯데리아 건대점", lat: 37.5405, lng: 127.0690, address: "서울 광진구" },
                { name: "롯데리아 명동점", lat: 37.5610, lng: 126.9850, address: "서울 중구" },
            ],
            "맥도날드": [
                { name: "맥도날드 강남점", lat: 37.4979, lng: 127.0276, address: "서울 강남구" },
                { name: "맥도날드 청담점", lat: 37.5240, lng: 127.0450, address: "서울 강남구" },
                { name: "맥도날드 신촌점", lat: 37.5555, lng: 126.9370, address: "서울 서대문구" },
                { name: "맥도날드 이태원점", lat: 37.5345, lng: 126.9940, address: "서울 용산구" },
            ],
            "KFC": [
                { name: "KFC 코엑스점", lat: 37.5115, lng: 127.0590, address: "서울 강남구" },
                { name: "KFC 대학로점", lat: 37.5825, lng: 127.0020, address: "서울 종로구" },
                { name: "KFC 야탑점", lat: 37.4115, lng: 127.1280, address: "성남 분당구" }, // A bit outer
            ]
        };

        // Flatten for random selection
        const allFranchiseLocations = [
            ...franchiseData["버거킹"],
            ...franchiseData["롯데리아"],
            ...franchiseData["맥도날드"],
            ...franchiseData["KFC"]
        ];

        for (const user of dummyUsers) {
            // Shuffle locations to ensure random selection
            const shuffledPlaces = [...MOCK_PLACES_DB].sort(() => 0.5 - Math.random());

            // Ensure uniqueness: Slice distinct items from the shuffled mock DB
            const targetCount = Math.min(20, MOCK_PLACES_DB.length); // Reduced to ~200 total
            // Mix generic places with some franchise places
            const placesForUser = shuffledPlaces.slice(0, targetCount);

            // Inject 2-3 Random Franchise reviews per user
            const randomFranchises = allFranchiseLocations.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 2);

            // Merge into places list
            const combinedPlaces = [
                ...placesForUser,
                ...randomFranchises.map(f => ({ ...f, category: "패스트푸드" }))
            ];

            for (let j = 0; j < combinedPlaces.length; j++) {
                const place = combinedPlaces[j];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                // Simulated Score Ranking
                let score;
                if (place.name.includes("버거킹")) {
                    score = (Math.random() * 1.5 + 8.0).toFixed(1); // 8.0 ~ 9.5 (High)
                } else if (place.name.includes("맥도날드")) {
                    score = (Math.random() * 1.5 + 7.0).toFixed(1); // 7.0 ~ 8.5 (Mid-High)
                } else if (place.name.includes("KFC")) {
                    score = (Math.random() * 1.5 + 6.5).toFixed(1); // 6.5 ~ 8.0 (Mid)
                } else if (place.name.includes("롯데리아")) {
                    score = (Math.random() * 1.5 + 6.0).toFixed(1); // 6.0 ~ 7.5 (Low-Mid)
                } else {
                    score = (10 - (j / combinedPlaces.length) * 4).toFixed(1); // Generic
                }

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

export const addVerificationData = async () => {
    if (!window.confirm("검증용 테스트 데이터를 추가하시겠습니까?\n(기존 데이터는 유지되며, 새로운 유저와 리뷰만 추가됩니다.)")) return;

    console.log("Adding verification data...");

    try {
        // 1. Create 5 Verifier Users
        const verifierUsers = [];
        for (let i = 1; i <= 5; i++) {
            verifierUsers.push({
                uid: `verifier_${i}`,
                name: `검증맨${i}`,
                email: `verify${i}@example.com`,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=Verifier${i}`,
                createdAt: serverTimestamp()
            });
        }
        await Promise.all(verifierUsers.map(u => setDoc(doc(db, "users", u.uid), u)));
        console.log("Created 5 verifier users.");

        // 2. Define Test Places
        const places = [
            { name: "[TEST] 인기가 많은 식당 (리뷰 5개)", lat: 37.5000, lng: 127.0300, category: "한식" },
            { name: "[TEST] 인기가 적은 식당 (리뷰 2개)", lat: 37.5050, lng: 127.0350, category: "일식" } // Should be hidden in Global
        ];

        const reviewPromises = [];

        // 3. Add 5 reviews to "Popular Place" (Passes Threshold)
        for (let i = 0; i < 5; i++) {
            const user = verifierUsers[i];
            const place = places[0];
            const reviewId = `verify_review_pop_${i}`;
            // Different scores to test averaging
            const score = (8.0 + i * 0.4).toFixed(1); // 8.0, 8.4, 8.8, 9.2, 9.6

            reviewPromises.push(setDoc(doc(db, "reviews", reviewId), {
                userId: user.uid,
                userName: user.name,
                userPhoto: user.photoURL,
                name: place.name,
                category: place.category,
                lat: place.lat,
                lng: place.lng,
                address: "서울 강남구 테헤란로 (검증용)",
                comment: `검증용 리뷰입니다 (인기맛집) - ${i + 1}`,
                globalScore: score,
                rankIndex: i,
                timestamp: serverTimestamp()
            }));
        }

        // 4. Add 2 reviews to "Unpopular Place" (Fails Threshold)
        for (let i = 0; i < 2; i++) {
            const user = verifierUsers[i];
            const place = places[1];
            const reviewId = `verify_review_unpop_${i}`;
            const score = "10.0"; // High score but few reviews -> Should be 0.0 or Hidden

            reviewPromises.push(setDoc(doc(db, "reviews", reviewId), {
                userId: user.uid,
                userName: user.name,
                userPhoto: user.photoURL,
                name: place.name,
                category: place.category,
                lat: place.lat,
                lng: place.lng,
                address: "서울 강남구 테헤란로 (검증용)",
                comment: `검증용 리뷰입니다 (비인기맛집) - ${i + 1}`,
                globalScore: score,
                rankIndex: i,
                timestamp: serverTimestamp()
            }));
        }

        await Promise.all(reviewPromises);
        console.log("Added verification reviews.");

        alert("검증 데이터 추가 완료!\n- '[TEST] 인기가 많은 식당': 전체 랭킹에 보여야 함\n- '[TEST] 인기가 적은 식당': 전체 랭킹에서 안 보여야 함");
        window.location.reload();

    } catch (e) {
        console.error("Error adding verification data:", e);
        alert("오류 발생: " + e.message);
    }
};
