/**
 * 네이버 지역 검색 API 및 지도 관련 서비스
 */

// Firebase Functions URL (배포된 주소)
const FIREBASE_FUNCTION_URL = "https://us-central1-sunsal-ranking.cloudfunctions.net/searchNaverPlaces";

// 주의: Client ID와 Secret은 보안상 백엔드에서 관리해야 함
// 프론트엔드 테스트를 위해 필요한 경우 프록시 서버(Cors-anywhere 등)를 사용해야 합니다.
const CLIENT_ID = "YOUR_NAVER_CLIENT_ID";
const CLIENT_SECRET = "YOUR_NAVER_CLIENT_SECRET";

/**
 * 네이버 지역 검색 API 호출 (Firebase Functions 프록시 경유)
 * @param {string} query 검색어 (예: "강남역 맛집")
 * @returns {Promise<Array>} 검색 결과 리스트
 */
export const searchNaverPlaces = async (query) => {
    if (!query) return [];

    try {
        const response = await fetch(`${FIREBASE_FUNCTION_URL}?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        const items = data.results || [];

        // 데이터 포맷 통일
        return items.map(item => ({
            name: item.name,
            address: item.address,
            category: item.category,
            lat: item.lat, // 이미 WGS84로 변환됨
            lng: item.lng,
            isLocation: false // 상호명 검색 결과임
        }));

    } catch (e) {
        console.error("Search API Error:", e);
        // Fallback: 오류 시 빈 배열 반환
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
            if (response.v2.addresses.length === 0) {
                reject("No result");
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

// 좌표 -> 주소 변환 (Reverse Geocoding)
export const reverseGeocode = (lat, lng) => {
    return new Promise((resolve, reject) => {
        if (!window.naver || !window.naver.maps || !window.naver.maps.Service) {
            reject("Naver Maps Service not loaded");
            return;
        }

        const coord = new window.naver.maps.LatLng(lat, lng);

        window.naver.maps.Service.reverseGeocode({
            coords: coord,
            orders: [
                window.naver.maps.Service.OrderType.ADDR,
                window.naver.maps.Service.OrderType.ROAD_ADDR
            ].join(',')
        }, function (status, response) {
            if (status !== window.naver.maps.Service.Status.OK) {
                return reject('Reverse Geocoding failed');
            }

            const items = response.v2.results;
            let address = "";
            let roadAddress = "";

            if (items.length > 0) {
                // 지번 주소 등 조합
                const region = items[0].region;
                const land = items[0].land;
                address = `${region.area1.name} ${region.area2.name} ${region.area3.name} ${land.number1}${land.number2 ? '-' + land.number2 : ''}`;
            }

            // 도로명 주소 찾기
            const roadItem = items.find(it => it.name === 'roadaddr');
            if (roadItem) {
                const region = roadItem.region;
                const land = roadItem.land;
                roadAddress = `${region.area1.name} ${region.area2.name} ${land.name} ${land.number1} ${land.addition0.value}`;
            }

            resolve(roadAddress || address || "주소 미상");
        });
    });
};
