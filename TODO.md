# RankEats Project Checklist

## 🔄 Development Workflow
1.  **Local Development**: `npm run dev` (localhost) for features & debugging.
2.  **Staging/Testing**: Verify on localhost (mock user) or production.
3.  **Production Deployment**: `npm run build` -> `firebase deploy`.
4.  **Database Management**: Critical focus on data integrity and management as users grow.

---

## 🚀 예정된 작업 (To Do)

### v1.8 Data & Management Update (Current)
- [ ] **데이터 관리 (Admin Page)**
    - [ ] 관리자 페이지 생성 (`/admin`)
    - [ ] 전체 데이터 백업 (JSON Export)
    - [ ] 데이터 복구 (Import) - *Optional*

### v1.9 (Future)
- [ ] **취향 일치도 알고리즘 고도화**: 실제 리뷰 데이터를 기반으로 한 정교한 추천 알고리즘.
- [ ] **마이 페이지 설정**: 내 프로필 사진 변경, 닉네임 변경 등.
- [ ] **리뷰 기능 확장**: 사진 다중 업로드, 태그 입력.

---

## ✅ 완료된 작업 (Done History)

### v1.8 (2026-01-10) - Review Management & Critical Fixes
*   **리뷰 관리 기능 (Review Edit/Delete)**:
    - [x] **수정 기능**: 사용자가 자신의 리뷰 내용과 평점을 수정 가능 (기존 순위 유지).
    - [x] **삭제 기능**: 사용자가 자신의 리뷰를 삭제 가능.
*   **버그 수정 (Bug Fixes)**:
    - [x] **Critical Fix**: 랭킹 화면 진입 시 발생하던 **White Screen Crash** 해결 (데이터 무결성 검사 추가).
    - [x] **Z-Index Fix**: 주소 검색창이 리뷰 모달 뒤로 숨는 문제 수정 (`z-index: 20002`).

### v1.7 (2026-01-10) - UX & Navigation Polish
*   **마이 페이지 접근성 개선**:
    - [x] 사이드바 메뉴 구조 개편 (`내 프로필`, `친구 목록` 등).
    - [x] "내 프로필" 클릭 시 모달이 아닌 전체 페이지(`MapArea`)로 이동하여 내 랭킹 지도 바로 보기 구현.
*   **지도/UI 수정**:
    - [x] 다크 모드 토글 기능 추가 및 CSS 수정.
    - [x] 네이버 지도 로고 Z-Index 수정.
    - [x] 뒤로 가기 시 지도가 사라지는 현상 해결.

### v1.6 (2026-01-09) - Sidebar & UI Overhaul
*   **사이드바 개편**: 메뉴 구조 단순화, "초기화" 등 위험 버튼 제거.
*   **친구 관리**: `FriendManagementModal` (팔로워/팔로잉 탭) 구현.

### v1.5 (2026-01-09) - Franchise Ranking Upgrade
*   **프랜차이즈 랭킹**: 브랜드별 차트 및 지점별 랭킹 리스트 구현.
*   **안정성**: 취향 일치도 고정값 적용, 지도 필터링 로직 개선.

### v1.3 (2026-01-08) - Profile & Social
*   **Social UI**: 인스타그램 스타일 프로필 페이지, 팔로워/팔로잉 모달.

### v1.2 (2026-01-08) - Friend System
*   **친구 시스템**: 유저 검색, 팔로우/언팔로우 기능.

---

## 📌 Development Notes & History
- **2026-01-10**: v1.8 리뷰 수정/삭제 기능 배포. 랭킹 등록 단계(Step 2)에서 발생하던 심각한 크래시(White Screen)를 `RecursiveRankingGroup` 컴포넌트 방어 코드 추가로 해결함.
- **2026-01-09**: v1.5 프랜차이즈 랭킹 고도화 완료.
- **2026-01-08**: v1.2 친구 시스템 및 프로필 UI 완료.
