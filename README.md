# 웨일 클래스 프레젠터

네이버 웨일에서 여러 수업 발표 자료를 관리하기 위한 로컬 우선 확장 프로그램이다. 개발 기준은 사용자 제공 v4 지시서이며 원문은 [`docs/source/spec-v4.md`](docs/source/spec-v4.md)에 보관한다.

GitHub 저장소: [LUCKYBRIDGE/naver-ppt](https://github.com/LUCKYBRIDGE/naver-ppt).

**현재 상태: 개발 기반 구축.** TypeScript/React/Vite와 Manifest V3 빌드, Launcher 및 Player/Remote/Editor 초기 화면, 독립 창 생성 경로가 있다. 자료 가져오기, PDF/PPTX 렌더링, 세션 동기화, 편집, 저장, 다중 모니터 자동 배치는 아직 구현하지 않았다. 실제 웨일 동작 검증은 별도 기록한다.

## 실행

Node.js 22.12 이상의 22.x, 24.x 또는 26 이상(현재 검증 환경 24.15.0), npm 10 이상.

```powershell
npm ci
npm run check
```

빌드 산출물은 `dist/`. 웨일 확장 관리 화면에서 개발자 모드를 켜고 압축해제된 확장앱으로 **dist 폴더**를 로드한다. 툴바 아이콘의 런처에서 세 개의 창을 각각 열어 확인한다. 폴더 선택과 브라우저 권한은 사용자 환경에서 수행한다. 런처 버튼은 현재 누를 때마다 새 창을 생성하며 창 재사용·재연결은 후속 단계이다.

```powershell
npm run dev          # UI 미리보기: http://127.0.0.1:5173/launcher/
npm run typecheck
npm test
npm run build
npm run check:skills
npm run licenses
```

개발 서버는 개발 편의용 로컬 서버이며 제품 런타임 의존성이 아니다. 일반 웹 페이지 미리보기에서는 chrome API 창 생성이 실행되지 않는다. 확장 검증은 빌드한 dist에서 수행한다. 현재 manifest에는 host 권한과 추가 API 권한이 없다.

Windows의 신뢰된 시스템 인증서를 Node가 사용하지 못해 `UNABLE_TO_VERIFY_LEAF_SIGNATURE`가 발생할 때는 해당 터미널 세션에서 `$env:NODE_OPTIONS = '--use-system-ca'`를 설정해 다시 설치한다. TLS 검증을 끄거나 npm 전역 설정을 바꾸지 않는다.

## 개발 자료

| 목적 | 파일 |
|---|---|
| AI/개발자의 기본 지침 | [AGENTS.md](AGENTS.md) |
| 개발 순서·작업 규칙 | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| 요구사항·구현 추적 | [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) |
| 아키텍처·모듈 책임 | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| 타입·명령·좌표 계약 | [docs/DATA_CONTRACTS.md](docs/DATA_CONTRACTS.md) |
| 저장·종료·복구 정책 | [docs/STORAGE_POLICY.md](docs/STORAGE_POLICY.md) |
| 결정과 문서 충돌 해석 | [docs/DECISIONS.md](docs/DECISIONS.md) |
| 기술 실험 | [docs/TECH_SPIKES.md](docs/TECH_SPIKES.md) |
| 지원 상태 | [docs/COMPATIBILITY_MATRIX.md](docs/COMPATIBILITY_MATRIX.md) |
| 검증 계획과 실행 결과 | [docs/TEST_PLAN.md](docs/TEST_PLAN.md), [docs/TEST_RESULTS.md](docs/TEST_RESULTS.md) |
| 라이선스와 보안 | [docs/LICENSES.md](docs/LICENSES.md), [docs/SECURITY.md](docs/SECURITY.md) |
| 프로젝트 스킬 5개 | [.agents/skills](.agents/skills) |

## 폴더 구조

```text
.agents/skills/           프로젝트 전용 스킬 5개
docs/source/             원문과 출처·해시
docs/                    요구사항·설계·저장·실험·테스트·라이선스
docs/generated/          lockfile에서 생성한 의존성 라이선스 목록
src/background/          서비스 워커·창 관리
src/launcher/            툴바 메뉴
src/player/              청중 화면
src/remote/              교사용 독립 리모컨
src/editor/              발표와 독립된 비공개 편집
src/core/                UI와 독립된 상태·명령·이벤트·역량 계약
src/adapters/            파일·웹 어댑터 계약 및 향후 구현
src/overlays/            글상자·판서·가리개 계약 및 향후 엔진
src/media/               미디어·자동 넘김·타이머 계약
src/storage/             수정 델타·복구·세션 파일 계약
src/export/              로컬 내보내기 결과 계약
src/shared/, styles/     공통 코드와 스타일
public/icons/, fonts/    검토 후 배포할 정적 자산
scripts/                 빌드·스킬·라이선스 검증 도구
tests/unit/              순수 함수·정책 테스트
tests/integration/       브라우저 API mock 테스트
tests/e2e/, manual/      추후 브라우저 자동화·웨일 실기기 절차
tests/fixtures/          합성 예제와 private 샘플 정책
dist/                    확장 배포 산출물(Git 제외)
```

다음 작업은 문서 §19.5 단계 A의 상태·메시지·복구 경계를 구현하고, 단계 B~E의 **PDF 2개 교차 + 비공개 편집 + 로컬 저장** 수직 기능을 완성하는 것이다. 진행 상황은 [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)에서 확인한다.

## 다른 PC나 새 대화에서 개발 이어가기

```powershell
git clone https://github.com/LUCKYBRIDGE/naver-ppt.git
cd naver-ppt
npm ci
npm run check
```

이 폴더를 Codex 프로젝트로 열고 `AGENTS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/TEST_RESULTS.md`부터 확인한다. 프로젝트 스킬은 `.agents/skills`에 함께 저장되어 있다. 실제 웨일 검증은 아직 미실시이므로 과거 자동 테스트 결과를 브라우저 검증 완료로 해석하지 않는다.

개발을 다시 맡길 때 사용할 수 있는 문구:

> 이 저장소의 AGENTS.md와 README.md, docs/IMPLEMENTATION_PLAN.md, docs/TEST_RESULTS.md를 읽고 현재 상태를 확인해줘. 다음 작업인 단계 A2의 세션 상태·명령 검증·영속화 경계를 구현하고, 발표와 Editor 선택의 독립성 및 중복/늦은 명령 처리를 테스트해줘. 로컬 우선과 원본 보존 원칙을 유지하고 실제 웨일 검증 여부를 구분해 보고해줘.
