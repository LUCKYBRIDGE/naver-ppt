# 실제 지원 수준

제품 구현 계획과 실제 호환성을 구분한다. 초기 기준선에서는 모든 콘텐츠 기능이 unverified다. 웨일 설치 파일 존재 확인만으로 API나 재생 호환성을 판정하지 않는다.

| 형식/환경 | 계획 | 현재 상태 | 지원 확정 조건 |
|---|---|---|---|
| Windows 웨일 MV3 | 우선 대상 | unverified | X-01 + 실기기 버전/권한 기록 |
| Chromium mock | 창 메시지 경계 검사 | 기반 자동 테스트만 | 제품 인수/실기기 보증 아님 |
| macOS 웨일 | 후속 | unverified | OS 창/권한/폰트/배치 시험 |
| PDF | 첫 자체 Player | unverified | X-03, 페이지/레이어/내보내기 시험 |
| PPTX | 후보 비교 후 부분 통합 | unverified | X-04, 실제 10종+ 기능별 결과 |
| PPT / SHOW | 파서/변환 경로 검증 | unverified | X-10, 오프라인/라이선스/실물 |
| Canva W0 | 링크·창·세션 노트 | unverified | X-08, URL/권한/재진입 |
| Miricanvas W0 | 링크·창·세션 노트 | unverified | X-09, URL/로그인/재진입 |
| 웹 W1/W2/W3 | 개별 추가 실험 | unverified | DOM/API/정책/권한/전체화면 |
| 다중 모니터 / focus 재생 | P0 품질 | unverified | X-02/05, 보이는 Player 5분 |
| downloads / File System Access | 로컬 저장 | unverified | X-07, 완료/취소/실패·재연결 |

## 기능별 판정 기준

- unverified: 실험/구현 결과 없음. 실제 기능 버튼을 활성화하지 않는다.
- experimental: 실험 경로만 있고 일반 수업 보증 없음.
- partial: 샘플/환경별 검증된 기능과 미지원 항목을 함께 설명.
- supported: 명시한 환경과 기능의 인수 근거가 있음.
- unsupported: 경로가 없거나 실험 실패·정책 제한을 확인함.

코드 계약: src/adapters/types.ts와 src/core/capabilities.ts. 계획만 있는 포맷도 항목에 포함하지만 실행 어댑터가 구현된 것은 아니다. 특정 기능을 승격하면 날짜/OS/브라우저/샘플/테스트 ID와 결과 문서 경로를 함께 기록한다.
