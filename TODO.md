## 🚀 작업 인계 사항 (Handover Note - Latest)
**현재 상태**: v1.8 Admin Page & Scoring Logic 완료

### 📅 오늘 작업한 내용 (Today's Work)
1.  **점수 자동 산정 시스템 (v1.8 Core)**:
    *   `src/utils/scoreCalculator.js`: 랭킹(Index) 기반 정규분포(1.0~10.0) 로직 구현.
    *   `App.jsx`: 리뷰 등록/수정/삭제 시 Batch Update로 전체 점수 재산정 연동.
2.  **데이터 관리자 페이지 (Admin Page)**:
    *   `src/pages/AdminPage.jsx`: 전체 데이터 백업(Export) 및 복구(Import) 기능 구현.
    *   `App.jsx`: `/admin` 라우트 연동.
    *   `src/lib/firebase.js`: 중복 export 문법 오류 수정.
3.  **문서화**:
    *   `목표 정리.md` (제 1원칙 문서) 작성 및 검증 수칙 정립.

---

## 📌 프로젝트 개요 (Overview)
맛집 랭킹 및 지도 서비스 'RankEats' (Sunsal)

## ✅ 완료된 작업 (Done)
*   **v1.8 Admin & Scoring**: 점수 자동 산정, 관리자 백업/복구 구현 완료.
*   **v1.2 ReviewModal 리팩토링**: 훅 분리 완료.
*   **v1.1 롤백 및 안정화**: 공페이지/흰 화면 이슈 해결 및 배포 완료
*   **지도 기능**: 네이버 지도 API 연동, 마커 클러스터링, 랭킹 기반 필터링 구현

## 📋 예정된 작업 (To Do)
### Dev Priority 1 (다음 작업)
*   [ ] **UI/UX 폴리싱**: 다크 모드(Dark Mode) 최적화 및 모바일 반응형 개선.
*   [ ] **사용자 경험 개선**: 로딩 인디케이터, 토스트 메시지 등 피드백 강화.

### Dev Priority 2 (기능 고도화)
*   [ ] 소셜 로그인 (구글/카카오) 인증 흐름 완성
*   [ ] 친구 초대 및 관리 기능 (Friend Management) UI 고도화
