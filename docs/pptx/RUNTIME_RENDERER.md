# 실제 Renderer와 제품 Runtime 결합

2026-10-12 22:16, Stage A/D/F · FR-004. 일반 PPTX 지원은 아직 unverified다.

## 구현
- `src/adapters/pptx/engineDriver.ts`: 공식 PresentationState의 그룹 진행을 그대로 사용한다. 원본 회전·확대·유한 반복 전달과 완료 visibility를 기존 어댑터로 연결한다.
- 모델의 동일 animations 참조, 그룹 수, 대상, cursor 증가, 늦은 start, 중복 start, disposal을 검사한다. 새로운 효과 스케줄러를 만들지 않는다.
- `tests/fixtures/pptxRuntimeRenderer.mjs`: 격리 검증에서만 실제 제품 Player URL에 렌더러를 마운트한다. Worker 파싱 → 안전 SVG DOM → engine driver → durablePlayback → 제품 runtime transport → 실제 background/소유권 → strict DB ACK 경로를 검사한다.
- 시험 확장은 dist의 ignored 복사본이다. 공식 후보 bundle과 ZIP Worker 자산을 함께 복사한다. 처음 누락된 ZIP Worker 자산 때문에 PPTX_WORKER_ERROR가 발생했고 자산 추가 후 통과했다. 제품 권한·의존성·일반 지원 활성화는 바꾸지 않았다.

## 검증
- check 2026-10-12 22:11:44: 49파일 651 tests, TypeScript/Vite/MV3/5스킬 PASS. 새 engine driver 단위 11개.
- 실제 Whale 5.39.412.57 headless, profile `node_modules/.cache/whale-pptx-owner/1791810925735/profile`.
- 합성 원본 2쪽/18553bytes, fingerprint `e5f78a47510bf663a5d813f80b7b8e193d0e8e468e084f22d5127b0c27e352b2`.
- 입장·퇴장·회전·이동·확대 5그룹 모두 완료 및 strict ACK. DB completedGroups=5, 회전90도·이동320·scale X1.5/Y0.5·퇴장 숨김.
- A/B/A 복귀 시 3그룹/회전90도 유지. Player 닫힘 후 새 owner가 새 Worker 모델을 파싱하고 5그룹의 같은 pose를 복원했다. 완료/복원 스크린샷을 직접 확인했다.
- 기존 duplicate/Editor/Remote/다른 수업의 명령 거부·불변, 제품 service worker 재시작 후 owner/checkpoint/receipt 유지, 늦은 epoch 거부, Remote reset, owner 승계 회귀 PASS.

## 재현
`scripts/verify-whale-webppt-spike.mjs --effects`로 로컬 후보 자산을 먼저 준비하고 check로 dist를 빌드한다. 다음 명령의 정확한 로컬 경로는 DEVELOPMENT.md의 기존 환경을 사용한다.

```powershell
node scripts/verify-whale-pptx-owner.mjs <Playwright-index.mjs> <Whale.exe>
```

## 남은 경계
- 일반 제품 import/Player UI는 아직 연결하지 않았다. 테스트 모듈 주입은 제품 UI 지원 완료가 아니다.
- 이 시험은 합성 효과와 새 Player 재파싱이다. 실제 교사 원본/PowerPoint 기준 충실도, 물리 창·스피커·DPI, 전체 브라우저 재시작의 이 통합 경로는 미실시다.
- 사용자 원본은 변경·업로드하지 않았다. PPTX bytes를 제품 DB에 자동 저장하지 않으며 PDF 전용 백업 범위는 그대로다.
- 다음: source vault/등록/preflight와 검증된 renderer 역량 경계를 설계한 뒤 제품 UI에 연결한다. 실제 10종/PowerPoint 충실도 근거 없이 지원을 승격하지 않는다.
