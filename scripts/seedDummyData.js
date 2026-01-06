const admin = require('firebase-admin');

// Service Account Key가 필요합니다.
// Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성
// 현재 환경에 키 파일이 없으므로, 로컬 테스트용으로는 Firebase Emulator나 클라이언트 SDK를 사용한 임시 페이지를 만드는 것이 낫습니다.
// 하지만 사용자 요청에 따라 seed script 구조를 만듭니다.

// 주의: 아래 경로는 실제 키 파일 경로로 변경해야 합니다.
// const serviceAccount = require("./serviceAccountKey.json");

/*
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const dummyUsers = [
    { uid: "dummy1", name: "미식가K", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
    { uid: "dummy2", name: "쩝쩝박사", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
    { uid: "dummy3", name: "동네주민", photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" }
];

const dummyReviews = [
    { content: "정말 맛있어요!", score: 9.5 },
    { content: "분위기가 깡패네요.", score: 9.0 },
    { content: "가성비 최고입니다.", score: 8.5 }
];

async function seed() {
    console.log("Seeding started...");

    for (const user of dummyUsers) {
        await db.collection('users').doc(user.uid).set({
            name: user.name,
            photoURL: user.photo,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Created user: ${user.name}`);

        // Create random reviews
        for (let i = 0; i < 5; i++) {
            const reviewRef = db.collection('reviews').doc();
            const randomReview = dummyReviews[Math.floor(Math.random() * dummyReviews.length)];
            await reviewRef.set({
                userId: user.uid,
                userName: user.name,
                userPhoto: user.photo,
                comment: randomReview.content,
                globalScore: randomReview.score,
                rankIndex: i,
                // Random location in Seoul
                lat: 37.5 + (Math.random() * 0.1),
                lng: 126.9 + (Math.random() * 0.1),
                name: `맛집 ${i}`,
                category: "한식",
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    }
    
    // Follow relationships
    await db.collection('users').doc('dummy1').collection('following').doc('dummy2').set({});
    await db.collection('users').doc('dummy2').collection('following').doc('dummy3').set({});

    console.log("Seeding complete!");
}

seed();
*/

console.log("이 스크립트를 실행하려면 Firebase Admin SDK 키가 필요합니다.");
console.log("대안으로, 브라우저 콘솔에서 실행할 수 있는 클라이언트 SDK 코드를 제공합니다.");
