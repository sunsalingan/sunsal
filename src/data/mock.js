

export const MOCK_PLACES_DB = [
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
    // more... (keeping it concise for this step but enough to look good)
    { name: "명동교자 본점", category: "한식", address: "서울 중구 명동10길 29", lat: 37.5625, lng: 126.9856 },
    { name: "우래옥", category: "한식", address: "서울 중구 창경궁로 62-29", lat: 37.5682, lng: 126.9987 },
    { name: "광화문국밥", category: "한식", address: "서울 중구 세종대로21길 53", lat: 37.5688, lng: 126.9755 },
    { name: "금돼지식당", category: "고기", address: "서울 중구 다산로 149", lat: 37.5562, lng: 127.0108 },
    { name: "소문난성수감자탕", category: "한식", address: "서울 성동구 연무장길 45", lat: 37.5428, lng: 127.0538 },
];

export const generateMockReviews = () => {
    return MOCK_PLACES_DB.map((place, idx) => ({
        id: `mock_${idx}`,
        ...place,
        userId: `mock_user_${idx % 5}`,
        userName: ["미식가K", "쩝쩝박사", "빵순이", "면식수행", "고기러버"][idx % 5],
        userPhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=mock_user_${idx % 5}`,
        globalScore: (Math.random() * 1.5 + 8.0).toFixed(1),
        rankIndex: idx,
        comment: "맛있어요! 추천합니다.",
        location: place.address,
        timestamp: { seconds: Date.now() / 1000 }
    }));
};
// Keeping others empty or simple
export const generateMockFriends = () => [];
export const generateMockUsers = () => [];
export const generateMockFollowList = () => [];
export const getFallbackProfile = () => ({
    name: "알 수 없음",
    rankCount: 0,
    followers: 0,
    following: 0,
    ranking: []
});

export const mockRestaurantSearch = (keyword) => {
    return MOCK_PLACES_DB.filter(p => p.name.includes(keyword) || p.address.includes(keyword));
};
