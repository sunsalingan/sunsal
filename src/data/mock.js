
export const MOCK_PLACES_DB = [
    {
        name: "테스트 식당 (서울시청)",
        category: "한식",
        address: "서울 중구 세종대로 110",
        lat: 37.5665,
        lng: 126.9780,
    }
];

export const generateMockReviews = () => [];
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
    return MOCK_PLACES_DB;
};
