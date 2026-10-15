# 실제 효과와 영속 ACK 연결
- 2026-10-12 21:58, PRD v5 Stage A/D/F, FR-004. 후보 제품 활성화/전체 완성 판정은 아니다.
- `durablePlayback.ts`는 파싱된 모델에서 받은 그룹 수·대상 ID와 저장 checkpoint를 대조한다. 지문/renderer·scope/revision/pose를 확인한 후 기존 engine driver를 복원한다. engine 그룹 계산/재생을 다시 구현하지 않는다.
- 순서는 Player BEGIN ACK → 기존 엔진 효과 → 완료 visibility → 실제 계산 pose 캡처 → CHECKPOINT strict ACK → 확정 cursor/pose 재투영이다. 효과 재생과 ACK 대기 모두 busy로 유지한다.
- 실패하면 현재 공개 snapshot의 확정 checkpoint를 복원한다. 서버에서 이미 commit한 응답만 잃었을 때는 공개된 완료 상태를 우선하여 같은 효과를 다시 세지 않는다. 자료 전환/늦은 ACK는 토큰 무효화 및 더 최신 선택 검사로 차단한다.
- driver는 totalGroups/targets를 실제 모델로부터 제공하고, restore는 공식 PresentationState를 재구성하며 next/start는 공식 playGroup과 검증된 원본 transform 전달을 사용한다. transport는 공개 Player snapshot·세션 명령 ACK만 주고 교사 노트를 받지 않는다.

## 증거
- check21:57:12: 47파일626tests, TypeScript/Vite/MV3/5스킬 PASS. 새 단위22개: begin 순서/ACK busy·미완료 취소/실패 rollback/응답 유실/더 최신 대기 선택/지문·모델 경계/분리 clone·최종 그룹 소진.
- 실제 Whale5.39.412.57 headless effects1791809838674: 실제 guarded 합성 PPTX를 Worker로 파싱해 fade 입장/퇴장·90도 회전·직선이동·축별 확대5그룹을 실행하고 제품 SessionHub/repository의 strict IndexedDB에 완료pose를 저장했다.
- 3단계 후 A→B→A의 회전90도 동일, 4단계 저장 실패 응답 주입 후 cursor/DB3단계·이동 원래 위치(e=0) 복원, 재시도 후e=320. 마지막 ACK 지연 중 두번째 play=busy. 완료5/DB5 및 회전90·확대1.5/0.5·퇴장숨김 유지 PASS.
- 동일 전용 프로필의 웨일을 정상 종료/재실행하고 **원본을 새 Worker로 다시 파싱**해 DB pose를 재투영했다. 동일 지문·완료5·회전/이동/확대/숨김 행렬 일치, isBusy=false PASS. revision13/receipt13 보존. 단순 metadata seed만의 저장 증거가 아니다.
- 합성 seed SHA256 `df8cbae841c4f8d69b85c332f8c8369351ad45f17bc4ea6e024e4f0f3392fe70`, 효과 변형/등록 지문 `e5f78a47510bf663a5d813f80b7b8e193d0e8e468e084f22d5127b0c27e352b2`.
- teacher1791809779509: 첨부23쪽/12클릭·수명 회귀 PASS, 원본 SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9` 불변. media1791809789973: WAV/MP4 bytes/hash·native 무음재생·pixel·전환/복귀 PASS. 모든 시험 외부 요청0, Worker 종료·SVG 경계 유지. 기존5효과 완료복귀 스크린샷 직접 확인.

## 남은 것
- native 실험은 격리 확장 안에서 제품 Hub/repository를 직접 호출한다. 실제 제품 background sender/PlayerAuthority의 신규 명령 end-to-end와 제품 Player UI는 아직 미연결이다.
- 실패 시험은 CHECKPOINT 실패 응답 주입이다. 실제 디스크 가득 참/장치 강제종료 시험은 아니다. 비정상 crash/절전/물리 다중창·듀얼모니터·DPI는 별도 인수다.
- 실제 교사10종+·PowerPoint 원본 기준·비영 시간곡선/전체 고급 효과·미디어 트리거·PPTX 백업은 미완료다. PPTX unverified 유지.
- 재현은 DEVELOPMENT.md의 기존 `verify-whale-webppt-spike.mjs --effects <PptxGenJS>` 명령이다. --effects는 이번부터 동일 프로필 정상 재실행까지 검사한다. 파일 원본을 복사/수정하지 않는다.
