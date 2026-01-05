/**
 * 네이버 지역 검색 API 및 지도 관련 서비스
 */

const NAVER_SEARCH_URL = "https://openapi.naver.com/v1/search/local.json";

// 주의: Client ID와 Secret은 보안상 백엔드에서 관리해야 함
// 프론트엔드 테스트를 위해 필요한 경우 프록시 서버(Cors-anywhere 등)를 사용해야 합니다.
const CLIENT_ID = "YOUR_NAVER_CLIENT_ID";
const CLIENT_SECRET = "YOUR_NAVER_CLIENT_SECRET";

/**
 * 네이버 지역 검색 API 호출
 * @param {string} query 검색어 (예: "강남역 맛집")
 * @returns {Promise<Array>} 검색 결과 리스트
 */
export const searchNaverPlaces = async (query) => {
    try {
        // 실제 구현 시 CORS 문제로 인해 직접 호출 대신 백엔드 API를 거쳐야 함
        // 예: const response = await fetch(`/api/naver-search?query=${encodeURIComponent(query)}`);

        console.log(`Searching Naver Places for: ${query}`);

        // 브라우저 직접 호출용 샘플 (CORS 제한이 없을 경우의 예시)
        /*
        const response = await fetch(`${NAVER_SEARCH_URL}?query=${encodeURIComponent(query)}&display=10`, {
            headers: {
                "X-Naver-Client-Id": CLIENT_ID,
                "X-Naver-Client-Secret": CLIENT_SECRET,
            },
        });
        const data = await response.json();
        return data.items.map(item => ({
            name: item.title.replace(/<[^>]*>?/gm, ''), // HTML 태그 제거
            address: item.address,
            category: item.category,
            link: item.link,
            // Naver Search API는 좌표(mapx, mapy)를 KATECH계 좌표로 주므로 변환 필요
            mapx: item.mapx,
            mapy: item.mapy
        }));
        */

        // 현재는 서버 구현이 안되어 있으므로 목업 데이터를 반환하되, 구조는 실제와 동일하게 유도
        return [
            { name: `${query} 1번지`, address: "서울시 강남구 ...", category: "한식", lat: 37.5665, lng: 126.9780 },
            { name: `${query} 핫플레이스`, address: "서울시 서초구 ...", category: "양식", lat: 37.5655, lng: 126.9770 },
        ];
    } catch (error) {
        console.error("Naver Search API Error:", error);
        return [];
    }
};

/**
 * 주소를 위경도 좌표로 변환 (Naver Maps Geocoder 사용)
 * @param {string} address 주소
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const geocodeAddress = (address) => {
    return new Promise((resolve, reject) => {
        if (!window.naver || !window.naver.maps || !window.naver.maps.Service) {
            reject("Naver Maps Service not loaded");
            return;
        }

        window.naver.maps.Service.geocode({ query: address }, (status, response) => {
            if (status !== window.naver.maps.Service.Status.OK) {
                reject("Geocoding failed");
                return;
            }
            const item = response.v2.addresses[0];
            resolve({
                lat: parseFloat(item.y),
                lng: parseFloat(item.x)
            });
        });
    });
};
