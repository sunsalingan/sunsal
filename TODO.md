## 🚀 작업 인계 사항 (Handover Note - Latest)
**현재 상태**: v2.3 Friend Recommendation System (Beta) Implemented

### 📅 오늘 작업한 내용 (Today's Work - 2026-01-19)
1.  **친구 추천 시스템 (Friend Recommendation)**:
    *   **Logic**: `src/utils/recommendation.js` - 위시리스트 및 리뷰 겹침 기반 취향 유사도(Similarity Score) 계산 알고리즘.
    *   **UI**: `src/components/features/FriendRecommendation.jsx` - 추천 사용자 카드 및 팔로우 버튼 구현.
    *   **Integration**: `App.jsx` 및 사이드바/헤더 연동 (진행 중).
2.  **데이터 관리**:
    *   `functions/index.js`: 더미 유저 정리(Recursive Delete) 로직 배포.

### 📅 2026-01-22 ~ 23 작업 요약 (Latest)
1.  **로그인 및 인앱 브라우저 개선**:
    *   `src/utils/inAppHandler.js`: 카카오톡/라인 등 인앱 브라우저 감지 및 Android 자동 리다이렉트(`intent://`) 구현.
    *   `src/components/auth/InAppBrowserGuard.jsx`: iOS용 "외부 브라우저 열기" 안내 가이드 컴포넌트 추가 및 앱 전역 적용.
2.  **보안 강화 (Security)**:
    *   `firestore.rules`: 데이터베이스 보안 규칙 작성 (테스트 모드 만료 해결).
    *   **Security Audit**: API Key 노출 확인(TODO), CSP 등 점검 완료.

---

## 📌 프로젝트 개요 (Overview)
맛집 랭킹 및 지도 서비스 'RankEats' (Sunsal)

## ✅ 완료된 작업 (Done)
*   **v2.3 Friend Recommendation**: 취향 기반 친구 추천 알고리즘 및 UI 구현 (Beta).
*   **v2.0 Ranking Logic Enhanced**: 사용자 활동량 가중치, 베이지안 평균, 진입 장벽(Threshold) 구현 완료.
*   **v1.9 Ranking Logic Enhanced**: 가중치 점수, 동점자 처리, 카테고리 개선 완료.
*   **v1.8 Admin & Features**: 닉네임 변경, 데이터 관리(백업/복구/초기화).
*   **v1.2 ReviewModal 리팩토링**: 훅 분리 완료.
*   **지도 기능**: 네이버 지도 API 연동, 마커 클러스터링, 랭킹 기반 필터링 구현

## 📋 예정된 작업 (To Do)
### Dev Priority 1 (다음 작업)
*   [ ] **친구 추천 검증**: 배포 후 추천 목록 로딩 및 팔로우 동작 확인.
*   [ ] **UI/UX 폴리싱**: 추천 카드 디자인 다듬기 및 모바일 반응형 점검.
*   [ ] **친구 시스템 고도화**: 친구 검색, 팔로우/언팔로우 UI 개선 및 피드 추적.
*   [ ] **UI/UX 폴리싱**: 다크 모드(Dark Mode) 최적화 및 모바일 반응형 개선.

### Dev Priority 2 (기능 고도화)
*   [ ] **API Key 보안**: 노출된 키를 `.env`로 이동하고 Git에서 제외.
*   [ ] 소셜 로그인 (구글/카카오) 인증 흐름 완성
