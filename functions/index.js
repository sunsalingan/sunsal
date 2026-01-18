const functions = require('firebase-functions');
const axios = require('axios');
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// 네이버 지역 검색 API 프록시
exports.searchNaverPlaces = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter required' });
        }

        try {
            const response = await axios.get(
                `https://openapi.naver.com/v1/search/local.json`,
                {
                    params: {
                        query: query,
                        display: 10,
                        sort: 'random'
                    },
                    headers: {
                        'X-Naver-Client-Id': functions.config().naver.client_id,
                        'X-Naver-Client-Secret': functions.config().naver.client_secret,
                    },
                }
            );

            // Naver API 응답을 앱에서 사용하는 형식으로 변환
            const results = response.data.items.map(item => {
                // Katec 좌표를 WGS84로 변환 (간단한 변환식)
                const lat = item.mapy ? parseFloat(item.mapy) / 10000000 : null;
                const lng = item.mapx ? parseFloat(item.mapx) / 10000000 : null;

                return {
                    name: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
                    address: item.roadAddress || item.address,
                    category: item.category || '기타',
                    lat: lat,
                    lng: lng,
                    link: item.link,
                };
            });

            res.json({ results });
        } catch (error) {
            console.error('Naver API Error:', error.response?.data || error.message);
            res.status(500).json({
                error: 'Failed to search',
                message: error.message
            });
        }
    });
});

// [NEW] Server-Side Recursive Delete for Dummy Users
exports.deleteDummyUsers = functions.https.onCall(async (data, context) => {
    // 1. Auth Check (Optional but recommended)
    // if (!context.auth) {
    //     throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }

    // 2. Identify Dummy Users
    // Logic: Find users with IDs starting with "mock_", "soonsal_user_", "verifier_"
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    const dummyDocs = [];

    snapshot.forEach(doc => {
        const id = doc.id;
        if (id.startsWith('mock_') || id.startsWith('soonsal_user_') || id.startsWith('verifier_')) {
            dummyDocs.push(doc.ref);
        }
    });

    // 3. Recursive Delete
    const promises = dummyDocs.map(ref => db.recursiveDelete(ref));
    await Promise.all(promises);

    return {
        success: true,
        message: `Recursively deleted ${dummyDocs.length} dummy user profiles.`
    };
});
