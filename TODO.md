## 🚀 작업 인계 사항 (Handover Note - Latest)
**현재 상태**: v2.0 Ranking Logic Enhanced (Bayesian, User Weights) & Admin Verified

### 📅 오늘 작업한 내용 (Today's Work - 2026-01-13)
1.  **점수 산정 및 랭킹 고도화**:
    *   **Tie-breaker Logic**: 같은 점수일 경우, 리뷰 활동량(가중치 총합)이 높은 쪽을 우선 노출.
    *   **Weighted Scoring**: 유저 활동량(리뷰 수)에 따른 점수 가중치 적용 (Logarithmic Scale).
    *   **Bounded Ranking**: 카테고리 랭킹 단계에서 전체 랭킹의 선택 범위를 제한하여 모순 방지.
2.  **기능 추가 및 개선**:
    *   **닉네임 변경**: 프로필 수정 기능 및 기존 리뷰 일괄 업데이트(Batch Update).
    *   **아시안 카테고리**: 태국, 베트남 등 '아시안' 음식 분류 추가.
    *   **관리자 페이지**: 데이터 초기화(Clear All) 기능 추가 (비밀번호 보호).
3.  **UI/UX 및 버그 수정**:
    *   프로필 편집 버튼 동작 오류 수정.
    *   리뷰 작성 모달 내 디버그 텍스트(DEBUG: ...) 제거.
    *   검색 플레이스홀더 문구 개선 (도로명 -> 식당명 유도).
    *   마커 클릭 시 랭킹 계산 오류(White Screen) 수정.
4.  **랭킹 로직 고도화 (v2.0)**:
    *   **Three-Tiered Ranking View**: 뷰(Global/My/Friends)별로 차별화된 점수 산정 로직 적용.
    *   **User Reliability Weights**: 리뷰어의 누적 활동량(0~2/3~9/10+)에 따른 가중치(0.3/0.7/1.0) 차등 적용.
    *   **Bayesian Average**: Global View에서 데이터가 적은 식당의 점수 뻥튀기 방지 (m=5, C=5.0).
    *   **Threshold**: Global View에서 리뷰 3개 미만 식당 자동 숨김 처리.
    *   **Admin Verification**: 시더(Seeder)에 검증 데이터 추가 기능 및 어드민 버튼 구현.

---

## 📌 프로젝트 개요 (Overview)
맛집 랭킹 및 지도 서비스 'RankEats' (Sunsal)

## ✅ 완료된 작업 (Done)
*   **v2.0 Ranking Logic Enhanced**: 사용자 활동량 가중치, 베이지안 평균, 진입 장벽(Threshold) 구현 완료.
*   **v1.9 Ranking Logic Enhanced**: 가중치 점수, 동점자 처리, 카테고리 개선 완료.
*   **v1.8 Admin & Features**: 닉네임 변경, 데이터 관리(백업/복구/초기화).
*   **v1.2 ReviewModal 리팩토링**: 훅 분리 완료.
*   **지도 기능**: 네이버 지도 API 연동, 마커 클러스터링, 랭킹 기반 필터링 구현

## 📋 예정된 작업 (To Do)
### Dev Priority 1 (다음 작업)
*   [ ] **친구 시스템 고도화**: 친구 검색, 팔로우/언팔로우 UI 개선 및 피드 추적.
*   [ ] **UI/UX 폴리싱**: 다크 모드(Dark Mode) 최적화 및 모바일 반응형 개선.

### Dev Priority 2 (기능 고도화)
*   [ ] 소셜 로그인 (구글/카카오) 인증 흐름 완성
