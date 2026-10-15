# PPTX ZIP Worker 수명과 제한 시간
- 목표: 압축 해제 중 교사 화면을 막지 않고 취소/시간 초과 시 Worker를 종료한다.
- 승인: 제품 완성까지 개발 및 포괄 승인. plan-feature/adapter-validation 적용.
- 완료 기준: 로컬 module Worker에서 기존 ZIP 검사 실행, 15초 제한·취소·성공/실패 cleanup, 원본 bytes 불변, 실제 Whale/CSP에서 자료 및 강제 지연 회귀.
- 하지 않는 것: DOMParser XML 검사 Worker화, 후보 렌더러 자체 parser Worker화, 전체 보안/성능 인수, 제품 PPTX 지원 활성화.
## 영향 범위
- packageWorker.ts/isolatedPackage.ts와 단위 테스트, 격리 비교 스크립트, 검증 문서.
- 위험: 입력 복사 최대128MB와 결과 최대256MB가 한시적으로 공존한다. 대용량 물리 환경 메모리 시험은 후속이다.
## 단계
1. [x] Worker와 제한 시간/취소/cleanup, 자동 check: 37파일345tests/TS/Vite/MV3 PASS(08:02).
2. [x] 실제 Whale module Worker ready 후 CPU 지연 timeout/취소·메인 interval 진행 및 교사 profile1791759821144/미디어1791759850360 회귀 PASS(TEST_RESULTS08:04). XML/후보 parser와 대용량 인수는 미완료.
## 근거
- https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- ArrayBuffer transfer는 원래 버퍼를 detach하므로 입력 사본만 전송한다. Blob/remote Worker는 사용하지 않는다.
