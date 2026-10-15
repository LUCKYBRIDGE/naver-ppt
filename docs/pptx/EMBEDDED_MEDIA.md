# PPTX 내장 미디어: 추출·출처 계약
- 기준: PRD v5 §11/24/25, FR-005/013/014. 2026-10-13, Windows Whale 5.39.412.57.
- 상태: 추출·출처 저장·Editor 명시 연결과 Player 원본 재추출·기본 원본 영역의 수동 재생/Remote/백업 복구를 연결했다. 원본 트리거·고급 변형/충실도는 미완료, PPTX 지원 수준은 unverified다. 최신 근거는 [PLAYER_MEDIA.md](PLAYER_MEDIA.md)를 따른다. 아래 Editor 시점의 미연결 기록은 과거 상태다.

## Editor 명시적 연결 (2026-10-13 03:05)
- 등록 PPTX의 선택한 쪽에서 `이 쪽의 내장 미디어 연결·재연결`을 누른다. guarded 원본 모델에서 그 쪽만 추출하며 다른 쪽의 외부 미디어를 가져오지 않는다. 연결 중에는 편집 대상 전환을 잠그고 취소 버튼을 제공한다. 닫힌 자료도 비공개 연결 가능하며 발표를 다시 활성화하지 않는다.
- `connectPreparedPptxMedia`는 출처 중복·등록16개 한도를 확인하고 모든 native metadata를 검사한 뒤 strict ADD를 보낸다. 명령마다 최신 세션/revision·원본 지문/쪽을 다시 확인한다. 같은 occurrence는 ID·구간·음량·재생 bookmark를 유지한 채 메모리 vault만 다시 연결한다.
- 일부 ADD가 이미 ACK된 뒤 취소/실패하면 해당 metadata를 되돌리지 않는다. 저장된 등록·재연결 개수를 안내하고 명시적 재시도로 이어간다. 이 부분 취소와 vault 실패는 단위 테스트로 확인했다. 원본 bytes를 자동 영속화하지 않는다.
- `probeMedia(file,signal?)`는 읽기/해시 이후 취소를 확인하고 native metadata 대기도 즉시 취소한다. 성공/실패/취소 모두 timeout·listener·native src·Blob URL을 정리한다. 재생 명령은 보내지 않는다.
- check03:02:53:67파일869tests·TypeScript/Vite/MV3/5스킬 PASS. 새14개(연결8/선택쪽1/native lifecycle5).
- 실제Whale `1791828240243/result.json`: 제품 Editor 버튼으로 현재 비공개쪽의 WAV/MP4 연결·같은출처 재연결, `.pptx` 읽기를 보류한 뒤 취소→세션 불변, WAV 읽기 실패→세션 불변, 다른 발표쪽 SVG/선택/bookmark/미디어 mount 불변, Enter/5viewport/380px 캡처 직접확인. 외부0/pageerror0/교사원본불변 PASS. generic local media vault 공급까지이며, 원본 위치·트리거/Player 원본 재추출·재생 복구 인수는 다음 단계다.
- foundation `profile-1791828240272/verification-result.json`과 PPTX 제품 `1791828240131/result.json` 모두 exit0 회귀 PASS.

## 구현
- guarded package/XML/order/model Worker 이후 `hydratePptxAssets`가 생성한 Blob과 URL을 같은 소유자에서 보관한다. 추가 다운로드/fetch 없이 Blob 직접 조회. dispose 시 URL과 Blob map 모두 해제한다.
- `preparePptxEmbeddedMedia`는 등록 원본 SHA-256/UUID/manifest part 순서를 검증하고 중첩 group의 image.media를 수집한다. 전체 참조 검사를 마친 뒤 WAV/MP3/MP4/WebM 헤더와 SHA-256을 검증한다. 외부·비소유·형식 불일치·빈 자산은 전체 batch 실패이며 부분 등록하지 않는다.
- 최대 100개 참조, 고유 Blob 총량 128MB, 자산별 128MB. 기존 문서 등록 한도 16개 미디어는 유지한다. 추출 한도와 등록 한도를 혼동하지 않는다. 중복 Blob은 한 번 읽되 서로 다른 요소 occurrence는 유지한다.
- AbortSignal을 읽기 전후에 검사한다. 읽기 도중 dispose한 자산도 결과로 반환하지 않는다. File/Blob은 메모리에만 있으며 함수 자체는 세션/DB/vault에 쓰지 않는다.
- `LocalMediaRef.embeddedSource?`는 `{type:'pptx',sourceFingerprint,sourcePart,elementPath}`다. Blob URL/바이너리/외부 URL은 금지한다. 경로는 안전한 `ppt/slides/*.xml`, 요소 경로 1~33개/각 인덱스 0~99999.
- strict 명령과 저장 검증은 PPTX 원본 지문 일치와 같은 출처의 중복 ID를 검사한다. 동일 바이트를 다른 요소에서 쓰는 경우는 허용한다. 공개 snapshot은 파일명을 제외하고 출처를 깊은 복사한다. 백업은 metadata만 저장하고 복구는 발표 대기·재생 정지다.
- `matchPptxEmbeddedMedia`는 원본 지문·part·요소 경로·슬라이드 ID·자산 SHA-256·kind/MIME·크기가 모두 맞는 단 하나의 준비 자산만 반환한다. 최초 자산이나 같은 해시만으로 대체하지 않는다.

## 검증
- `scripts/dev.ps1 check` 2026-10-13 02:54:16: 65파일/855 tests, TypeScript/Vite/MV3/프로젝트 스킬5개 PASS. 신규32개: 추출15/계약17.
- `scripts/verify-whale-pptx-embedded-media.mjs` 실제 headless Whale, 전용 profile `1791827767082/result.json`: 교사23쪽/내장0, 원본 SHA-256 불변. 합성 canonical PPTX WAV64044B/4초, MP416423B/2.134767초를 원래 합성 미디어 바이트의 SHA-256과 대조해 일치했다. 원본 part/등록쪽 대응·외부 참조 거부·취소·dispose 확인, 외부 요청0/pageerror0.
- 같은 시험에서 제품 Editor opt-in으로 합성 PPTX를 등록하고 실제 Editor sender ADD_LOCAL_MEDIA 저장을 확인했다. 다른 원본과 중복 출처 명령은 거부, metadata bundle 생성/새 수업 복구는 출처 보존·발표대기 확인. 내장 연결 버튼이나 Player 재생 시험으로 확대 해석하지 않는다.
- 변경 후 제품 PPTX `1791827711887/result.json`(23쪽/12클릭·Remote취소/재시도·overlay·새Player/백업복구·3창5viewport·원본불변) 및 foundation `profile-1791827712012/verification-result.json`(PDF·로컬미디어·저장/종료/복구·소유권·자동넘김) 모두 exit0 PASS.
- 시험 probe의 최초 실패는 제품과 다른 Vite 설정에서 Worker initializer가 제거된 탓이었다. 제품과 같은 initializer 보존 설정을 추가했다. 두 번째는 native picker 환경에서 fallback input을 찾은 시험 설정 문제였으며, fallback을 명시하고 제품 UI 등록을 재검증했다. OS chooser 시험을 대체하지 않는다.

## 남은 필수 작업
1. Player의 원본 재추출과 정확한 mediaVault 공급·새 Player/백업 복구. Editor 연결·중복·취소/실패 안내는 위 단계까지 구현했다.
2. 원본 영상 사각형/회전/그룹 변형/레이어·효과 트리거를 확인하고 기존 Player 소유권/epoch/checkpoint/Remote에 연결. 자동 재생은 암묵적으로 시작하지 않는다.
3. 실제 재생·자료 교차·새 Player·백업 복구, 포커스/스피커/물리 환경 인수. 합성 자료 검증은 실제 교사 원본 충실도 검증과 별개다.
4. 원본색 픽셀 추출·PowerPoint 비교·실제 교사10종 및 PRD 전체 최종 인수는 계속 미완료다.
