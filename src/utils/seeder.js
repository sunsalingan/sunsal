
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

        // 3. Create extended dummy users (12 users)
        const dummyUsers = [
            { uid: "soonsal_user_1", name: "미식가K", email: "gourmet@example.com" },
            { uid: "soonsal_user_2", name: "쩝쩝박사", email: "yumyum@example.com" },
            { uid: "soonsal_user_3", name: "빵순이", email: "breadlover@example.com" },
            { uid: "soonsal_user_4", name: "면식수행", email: "noodle@example.com" },
            { uid: "soonsal_user_5", name: "고기러버", email: "meatlover@example.com" },
            { uid: "soonsal_user_6", name: "카페투어", email: "cafelife@example.com" },
            { uid: "soonsal_user_7", name: "노포매니아", email: "oldshop@example.com" },
            { uid: "soonsal_user_8", name: "힙플레이스", email: "hip@example.com" },
            { uid: "soonsal_user_9", name: "직장인점심", email: "lunch@example.com" },
            { uid: "soonsal_user_10", name: "데이트코스", email: "date@example.com" },
            { uid: "soonsal_user_11", name: "매운맛중독", email: "spicy@example.com" },
            { uid: "soonsal_user_12", name: "건강식단", email: "healthy@example.com" }
        ].map(u => ({
            ...u,
            photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`,
            createdAt: serverTimestamp()
        }));

        for (const user of dummyUsers) {
            await setDoc(doc(db, "users", user.uid), user);
        }
        console.log(`Created ${dummyUsers.length} dummy users.`);

        // 4. Create Massive Restaurant Data (100+ items)
        const locations = [
            // 강남구
            { name: "땀땀", category: "아시안", address: "서울 강남구 강남대로98길 12-5", lat: 37.5002, lng: 127.0275 },
            { name: "고신", category: "고기", address: "서울 강남구 역삼로3길 17-6", lat: 37.4939, lng: 127.0315 },
            { name: "알라보 강남점", category: "양식", address: "서울 강남구 테헤란로 129", lat: 37.4996, lng: 127.0325 },
            { name: "미즈컨테이너 강남웨스트", category: "양식", address: "서울 강남구 강남대로102길 13", lat: 37.5023, lng: 127.0264 },
            { name: "정돈 강남점", category: "일식", address: "서울 강남구 강남대로110길 19", lat: 37.5034, lng: 127.0270 },
            { name: "쉐이크쉑 강남", category: "양식", address: "서울 강남구 강남대로 452", lat: 37.5027, lng: 127.0256 },
            { name: "마녀주방 강남점", category: "양식", address: "서울 강남구 강남대로94길 9", lat: 37.4993, lng: 127.0278 },
            { name: "바비레드 강남본점", category: "양식", address: "서울 강남구 봉은사로6길 39", lat: 37.5023, lng: 127.0284 },
            { name: "감성타코 강남역점", category: "양식", address: "서울 강남구 강남대로 406", lat: 37.4988, lng: 127.0267 },
            { name: "호랑이식당", category: "일식", address: "서울 강남구 봉은사로4길 20", lat: 37.5035, lng: 127.0245 },
            { name: "도산분식", category: "분식", address: "서울 강남구 도산대로49길 10-6", lat: 37.5238, lng: 127.0368 },
            { name: "다운타우너 청담", category: "양식", address: "서울 강남구 도산대로53길 14", lat: 37.5245, lng: 127.0389 },
            { name: "리틀넥 청담", category: "양식", address: "서울 강남구 도산대로51길 17", lat: 37.5239, lng: 127.0375 },
            { name: "런던베이글뮤지엄 도산", category: "카페", address: "서울 강남구 언주로168길 33", lat: 37.5255, lng: 127.0345 },
            { name: "노티드 청담", category: "카페", address: "서울 강남구 도산대로53길 15", lat: 37.5242, lng: 127.0385 },

            // 마포구 (홍대/연남/합정)
            { name: "연남동 툭툭누들타이", category: "아시안", address: "서울 마포구 성미산로 161-8", lat: 37.5619, lng: 126.9245 },
            { name: "소이연남", category: "아시안", address: "서울 마포구 동교로 267", lat: 37.5635, lng: 126.9255 },
            { name: "하카타분코", category: "일식", address: "서울 마포구 독막로19길 43", lat: 37.5489, lng: 126.9234 },
            { name: "옥동식", category: "한식", address: "서울 마포구 양화로7길 44-10", lat: 37.5525, lng: 126.9158 },
            { name: "크레이지카츠", category: "일식", address: "서울 마포구 포은로2나길 44", lat: 37.5505, lng: 126.9102 },
            { name: "빠레뜨한남 연남점", category: "양식", address: "서울 마포구 동교로 257", lat: 37.5623, lng: 126.9248 },
            { name: "랜디스도넛 연남", category: "카페", address: "서울 마포구 동교로 247", lat: 37.5626, lng: 126.9256 },
            { name: "테일러커피 서교점", category: "카페", address: "서울 마포구 와우산로33길 46", lat: 37.5555, lng: 126.9288 },
            { name: "만동제과", category: "카페", address: "서울 마포구 연희로 32", lat: 37.5595, lng: 126.9275 },
            { name: "푸하하크림빵", category: "카페", address: "서울 마포구 양화로19길 22-25", lat: 37.5582, lng: 126.9245 },
            { name: "바다회사랑", category: "일식", address: "서울 마포구 동교로27길 60", lat: 37.5568, lng: 126.9198 },
            { name: "진진", category: "중식", address: "서울 마포구 잔다리로 123", lat: 37.5559, lng: 126.9123 },
            { name: "이치류 홍대본점", category: "일식", address: "서울 마포구 잔다리로3안길 44", lat: 37.5518, lng: 126.9205 },
            { name: "미분당 합정점", category: "아시안", address: "서울 마포구 월드컵로1길 14", lat: 37.5492, lng: 126.9142 },
            { name: "오레노라멘 합정본점", category: "일식", address: "서울 마포구 독막로6길 14", lat: 37.5485, lng: 126.9175 },

            // 용산구 (한남/이태원/용산)
            { name: "난포 한남", category: "한식", address: "서울 용산구 이태원로49길 18", lat: 37.5385, lng: 127.0012 },
            { name: "다운타우너 한남", category: "양식", address: "서울 용산구 이태원로42길 28-4", lat: 37.5358, lng: 127.0019 },
            { name: "오월의종 본점", category: "카페", address: "서울 용산구 이태원로 229", lat: 37.5365, lng: 127.0005 },
            { name: "패션5", category: "카페", address: "서울 용산구 이태원로 272", lat: 37.5398, lng: 127.0025 },
            { name: "부자피자", category: "양식", address: "서울 용산구 이태원로55가길 28", lat: 37.5391, lng: 127.0008 },
            { name: "몽탄", category: "고기", address: "서울 용산구 백범로99길 50", lat: 37.5318, lng: 126.9715 },
            { name: "용산마루", category: "일식", address: "서울 용산구 한강대로15길 19-28", lat: 37.5285, lng: 126.9658 },
            { name: "쌤쌤쌤", category: "양식", address: "서울 용산구 한강대로50길 25", lat: 37.5305, lng: 126.9685 },
            { name: "테디뵈르하우스", category: "카페", address: "서울 용산구 한강대로40가길 42", lat: 37.5298, lng: 126.9692 },
            { name: "꺼거", category: "중식", address: "서울 용산구 한강대로48길 10", lat: 37.5302, lng: 126.9698 },

            // 중구/종로구 (명동/을지로/광화문)
            { name: "명동교자 본점", category: "한식", address: "서울 중구 명동10길 29", lat: 37.5625, lng: 126.9856 },
            { name: "하동관 명동본점", category: "한식", address: "서울 중구 명동9길 12", lat: 37.5645, lng: 126.9842 },
            { name: "우래옥", category: "한식", address: "서울 중구 창경궁로 62-29", lat: 37.5682, lng: 126.9987 },
            { name: "을지면옥", category: "한식", address: "서울 중구 충무로14길 2-1", lat: 37.5663, lng: 126.9922 }, // (Note: Moved, but keeping for dummy legacy)
            { name: "평양면옥", category: "한식", address: "서울 중구 장충단로 207", lat: 37.5668, lng: 127.0065 },
            { name: "필동면옥", category: "한식", address: "서울 중구 서애로 26", lat: 37.5585, lng: 126.9958 },
            { name: "호랑이", category: "카페", address: "서울 중구 을지로 157", lat: 37.5668, lng: 126.9965 },
            { name: "챔프커피 제3작 업실", category: "카페", address: "서울 중구 을지로 157 3층", lat: 37.5665, lng: 126.9962 },
            { name: "동원집", category: "한식", address: "서울 중구 을지로11길 22", lat: 37.5662, lng: 126.9915 },
            { name: "산청숯불가든", category: "고기", address: "서울 중구 을지로 114-6", lat: 37.5661, lng: 126.9908 },
            { name: "진주회관", category: "한식", address: "서울 중구 세종대로11길 26", lat: 37.5628, lng: 126.9752 },
            { name: "토속촌 삼계탕", category: "한식", address: "서울 종로구 자하문로5길 5", lat: 37.5776, lng: 126.9716 },
            { name: "광화문국밥", category: "한식", address: "서울 중구 세종대로21길 53", lat: 37.5688, lng: 126.9755 },
            { name: "청진옥", category: "한식", address: "서울 종로구 종로3길 32", lat: 37.5708, lng: 126.9798 },
            { name: "포비 광화문", category: "카페", address: "서울 종로구 종로3길 17", lat: 37.5712, lng: 126.9785 },

            // 성동구 (성수)
            { name: "소문난성수감자탕", category: "한식", address: "서울 성동구 연무장길 45", lat: 37.5428, lng: 127.0538 },
            { name: "대림창고", category: "카페", address: "서울 성동구 성수이로 78", lat: 37.5415, lng: 127.0562 },
            { name: "어니언 성수", category: "카페", address: "서울 성동구 아차산로9길 8", lat: 37.5448, lng: 127.0558 },
            { name: "블루보틀 성수", category: "카페", address: "서울 성동구 아차산로 7", lat: 37.5480, lng: 127.0450 },
            { name: "할머니의 레시피", category: "한식", address: "서울 성동구 서울숲2길 44-13", lat: 37.5468, lng: 127.0425 },
            { name: "팩피", category: "양식", address: "서울 성동구 왕십리로 136", lat: 37.5452, lng: 127.0458 },
            { name: "제스티살룬 성수", category: "양식", address: "서울 성동구 서울숲2길 19", lat: 37.5465, lng: 127.0418 },
            { name: "난포", category: "한식", address: "서울 성동구 서울숲4길 18-8", lat: 37.5469, lng: 127.0429 },
            { name: "성수다락", category: "양식", address: "서울 성동구 성수이로7길 24", lat: 37.5422, lng: 127.0545 },
            { name: "카멜커피 성수", category: "카페", address: "서울 성동구 성덕정19길 6", lat: 37.5395, lng: 127.0525 },

            // 기타 유명 맛집
            { name: "봉피양 방이점", category: "한식", address: "서울 송파구 양재대로71길 1-4", lat: 37.5105, lng: 127.1245 },
            { name: "금돼지식당", category: "고기", address: "서울 중구 다산로 149", lat: 37.5562, lng: 127.0108 },
            { name: "신당동 마복림 떡볶이", category: "분식", address: "서울 중구 다산로35길 5", lat: 37.5651, lng: 127.0165 },
            { name: "애플하우스", category: "분식", address: "서울 동작구 동작대로27다길 29", lat: 37.4862, lng: 126.9825 },
            { name: "오토김밥", category: "분식", address: "서울 용산구 우사단로10다길 1", lat: 37.5332, lng: 127.0005 },
            { name: "멘야하나비 잠실점", category: "일식", address: "서울 송파구 백제고분로45길 38", lat: 37.5098, lng: 127.1085 },
            { name: "진미평양냉면", category: "한식", address: "서울 강남구 학동로 305-3", lat: 37.5162, lng: 127.0358 },
            { name: "쉑쉑버거 두타", category: "양식", address: "서울 중구 장충단로 275", lat: 37.5688, lng: 127.0088 },
            { name: "에그슬럿 코엑스", category: "양식", address: "서울 강남구 영동대로 513", lat: 37.5115, lng: 127.0595 },
            { name: "팀호완 삼성점", category: "중식", address: "서울 강남구 봉은사로86길 14", lat: 37.5118, lng: 127.0568 },
            { name: "딤딤섬 센트럴시티", category: "중식", address: "서울 서초구 신반포로 176", lat: 37.5045, lng: 127.0045 },
            { name: "하프커피 파미에스테이션", category: "카페", address: "서울 서초구 사평대로 205", lat: 37.5052, lng: 127.0052 },
            { name: "아우어베이커리 가로수길", category: "카페", address: "서울 강남구 강남대로162길 39", lat: 37.5218, lng: 127.0225 },
            { name: "새들러하우스", category: "카페", address: "서울 강남구 도산대로17길 10", lat: 37.5198, lng: 127.0235 },
            { name: "마일스톤커피", category: "카페", address: "서울 강남구 논현로159길 49", lat: 37.5245, lng: 127.0282 },
            { name: "청와옥 본점", category: "한식", address: "서울 송파구 위례성대로 48", lat: 37.5145, lng: 127.1205 },
            { name: "농민백암순대 본점", category: "한식", address: "서울 강남구 선릉로86길 40-4", lat: 37.5035, lng: 127.0515 },
            { name: "중앙해장", category: "한식", address: "서울 강남구 영동대로86길 17", lat: 37.5085, lng: 127.0655 },
            { name: "새벽집 청담", category: "한식", address: "서울 강남구 도산대로101길 6", lat: 37.5255, lng: 127.0515 },
            { name: "영천영화 청담", category: "고기", address: "서울 강남구 도산대로90길 3", lat: 37.5242, lng: 127.0498 },
            { name: "최우영스시", category: "일식", address: "서울 구로구 디지털로32나길 17-6", lat: 37.4835, lng: 126.8985 },
            { name: "은행골 본점", category: "일식", address: "서울 관악구 조원로 10-1", lat: 37.4832, lng: 126.9095 },
            { name: "가마로강정 본점", category: "분식", address: "서울 송파구 송파대로 366", lat: 37.5005, lng: 127.1035 },
            { name: "오장동 흥남집", category: "한식", address: "서울 중구 마른내로 114", lat: 37.5645, lng: 127.0028 },
            { name: "필동함박", category: "양식", address: "서울 중구 퇴계로36길 14", lat: 37.5598, lng: 126.9942 },
            { name: "잉꼬칼국수", category: "한식", address: "경기 구리시 체육관로171번길 11", lat: 37.6015, lng: 127.1352 }, // 서울 근교 포함
            { name: "카페 노티드 안국", category: "카페", address: "서울 종로구 북촌로 6-3", lat: 37.5782, lng: 126.9855 },
            { name: "프릳츠 도화", category: "카페", address: "서울 마포구 새창로2길 17", lat: 37.5412, lng: 126.9535 },
            { name: "헬카페", category: "카페", address: "서울 용산구 보광로 76", lat: 37.5288, lng: 126.9965 },
            { name: "매뉴팩트커피 방배", category: "카페", address: "서울 서초구 서초대로27길 15", lat: 37.4915, lng: 126.9985 }
        ];

        // Ensure 100 items by duplicating with slight variation if needed, but 70+ is good start.
        // Let's add more to reach 100 roughly by varying categories of generic places
        for (let i = 0; i < 30; i++) {
            const basePlace = locations[i];
            locations.push({
                ...basePlace,
                name: `${basePlace.name} 2호점`,
                lat: basePlace.lat + 0.005,
                lng: basePlace.lng + 0.005,
                address: basePlace.address.replace(/\d+$/, `${Math.floor(Math.random() * 100)}`)
            });
        }

        console.log(`Prepared ${locations.length} restaurant locations.`);

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
            "평범하지만 깔끔해요.",
            "간이 딱 맞아서 좋았어요.",
            "매장이 청결하고 관리가 잘 되어 있습니다.",
            "역시 유명한 이유가 있네요.",
            "오픈런 필수!",
            "생각보다 양이 적어요.",
            "음식이 너무 늦게 나와요.",
            "직원분들이 파이팅이 넘치네요.",
            "주차하기가 좀 힘들어요.",
            "가족 외식 장소로 강추합니다.",
            "혼밥하기에도 부담 없어요."
        ];

        let reviewCount = 0;
        for (const user of dummyUsers) {
            // Each user writes 5-15 reviews
            const numReviews = Math.floor(Math.random() * 11) + 5;

            // Randomly select unique places for this user
            const loadedPlaces = new Set();

            for (let j = 0; j < numReviews; j++) {
                let placeIndex;
                do {
                    placeIndex = Math.floor(Math.random() * locations.length);
                } while (loadedPlaces.has(placeIndex));
                loadedPlaces.add(placeIndex);

                const place = locations[placeIndex];
                const comment = comments[Math.floor(Math.random() * comments.length)];

                // Score weighted towards bad/good
                let score = (Math.random() * 5 + 5).toFixed(1); // 5.0 ~ 10.0
                if (Math.random() > 0.7) score = (Math.random() * 2 + 8).toFixed(1); // 30% chance of high score

                const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                await setDoc(doc(db, "reviews", reviewId), {
                    userId: user.uid,
                    userName: user.name,
                    userPhoto: user.photoURL,
                    name: place.name,
                    category: place.category,
                    // Small jitter to prevent identical coordinates if user reviews same place (though we made them unique per user here)
                    // But if multiple users review same place, we want them stacked or close.
                    // Let's keep original coords for clustering to work best on 'same place'
                    lat: place.lat,
                    lng: place.lng,
                    address: place.address,
                    comment: comment,
                    globalScore: parseFloat(score),
                    rankIndex: j + 1, // 1-based index
                    timestamp: serverTimestamp()
                });
                reviewCount++;
            }
        }
        console.log(`Created ${reviewCount} dummy reviews.`);

        // 5. Create Complex Follow Relationships
        // Randomly follow 2-5 other users each
        let followCount = 0;
        for (const user of dummyUsers) {
            const numFollows = Math.floor(Math.random() * 4) + 2;
            const targets = new Set();
            while (targets.size < numFollows) {
                const targetIdx = Math.floor(Math.random() * dummyUsers.length);
                if (dummyUsers[targetIdx].uid !== user.uid) {
                    targets.add(dummyUsers[targetIdx]);
                }
            }

            for (const target of targets) {
                // Bi-directional for now to replicate 'friend' feel easily, or just following
                // Let's do following
                await setDoc(doc(db, "users", user.uid, "following", target.uid), {
                    uid: target.uid,
                    name: target.name,
                    photoURL: target.photoURL,
                    timestamp: serverTimestamp()
                });
                // Add to target's followers
                await setDoc(doc(db, "users", target.uid, "followers", user.uid), {
                    uid: user.uid,
                    name: user.name,
                    photoURL: user.photoURL,
                    timestamp: serverTimestamp()
                });
                followCount++;
            }
        }

        console.log(`Created ${followCount} follow relationships.`);

        alert("데이터 초기화 및 시딩 완료! 페이지를 새로고침하면 적용됩니다.");
        window.location.reload();

    } catch (e) {
        console.error("Error seeding data:", e);
        alert("데이터 초기화 중 오류가 발생했습니다: " + e.message);
    }
};
