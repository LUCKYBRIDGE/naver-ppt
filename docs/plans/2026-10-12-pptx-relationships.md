# PPTX 내부 연결 검사
- 목표: 렌더러에 입력하기 전에 관계 파일의 소유 항목과 내부 대상을 검증한다.
- 승인: 제품 완성까지 개발 및 포괄 승인. plan-feature와 adapter-validation 적용.
- 완료 기준: 정상 상대/루트 경로 허용, 루트 이탈·인코딩 우회·없는 항목·중복 ID 거부, 외부 주소 비노출, 실제 웨일에서 교사 자료 및 합성 미디어 회귀 통과.
- 하지 않는 것: 외부 연결 실행, 미디어 signature/ContentTypes 전체 검증, 렌더러 제품 채택, CRC/CPU 시간 격리.
## 영향 범위
- 새 파일: src/adapters/pptx/relationshipTargets.ts와 단위 테스트.
- 수정: packageGuard.ts, 격리 웨일 비교 스크립트, 검증 및 인수인계 문서.
- 위험: 정상 파일의 특수 URI가 보수적인 검사에서 거부될 수 있다. 제품 지원으로 승격하지 않는다.
## 단계
1. [x] 관계 대상 해석과 XML 관계 검사, 자동 check: 2026-10-12 07:54 35파일317tests/TS/Vite/MV3 PASS.
2. [x] 실제 교사 23쪽 profile1791759288485 및 합성 미디어 profile1791759303704를 실제 Whale에서 재검증하고 제한 기록(TEST_RESULTS07:55). 원본 충실도/제품 Player 연결은 완료 아님.
## 근거
- Microsoft System.IO.Packaging 문서: 내부 대상은 패키지 항목, 외부 대상은 상대 또는 절대 URI일 수 있다. 외부 상대 URI는 제품에서 자동 해석하지 않는다.
- https://learn.microsoft.com/en-us/dotnet/api/system.io.packaging.package.createrelationship
