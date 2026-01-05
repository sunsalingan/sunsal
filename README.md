# RankEats (순살 랭킹)

RankEats는 사용자가 직접 만드는 신뢰할 수 있는 맛집 랭킹 플랫폼입니다. 내가 가본 맛집들의 순위를 매기고, 친구들과 공유하며 진짜 맛집을 발견하세요.

## 🚀 프로젝트 시작하기

### 1. 필수 요구사항
- Node.js (v16 이상 권장)
- npm

### 2. 설치 및 실행
프로젝트 루트 디렉토리에서 다음 명령어를 실행하세요.

```bash
# 의존성 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

### 3. 주요 기능
- **맛집 랭킹**: 나만의 맛집 리스트를 생성하고 순위를 매길 수 있습니다.
- **친구 랭킹 공유**: 친구의 랭킹과 내 랭킹을 비교하고, 취향(Match Rate)을 확인할 수 있습니다.
- **지도 보기**: 네이버 지도 API를 연동하여 위치 기반으로 맛집을 탐색합니다.
- **리뷰 작성**: 위치 인증 및 영수증 인증(프로토타입) 절차를 거친 신뢰도 높은 리뷰 시스템.

## 🛠️ 기술 스택
- **Library**: React, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Map**: Naver Maps API
- **Database**: Firebase (Firestore, Auth)

## 📂 프로젝트 구조
```
src/
├── components/
│   ├── features/       # 주요 기능 컴포넌트 (지도, 리스트, 모달 등)
│   ├── layout/         # 레이아웃 컴포넌트 (헤더 등)
│   └── ui/             # 공통 UI 요소 (현재는 features에 통합됨)
├── data/               # Mock 데이터
├── lib/                # 외부 라이브러리 설정 (Firebase 등)
├── App.jsx             # 메인 앱 컴포넌트
└── main.jsx            # 진입점
```

## 📝 참고 사항
- **네이버 지도**: `localhost` 및 배포 도메인이 네이버 클라우드 콘솔에 등록되어 있어야 합니다. (현재 Client ID: `jod7e9zh3o`)
- **API**: 현재 초기 버전으로 일부 기능은 Mock Data를 사용합니다.
