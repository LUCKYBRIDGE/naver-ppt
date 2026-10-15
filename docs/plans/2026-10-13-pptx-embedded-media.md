# PPTX 내장 미디어 연결
- 목표: 원본에서 검증한 내장 음원·영상을 Player가 재생하고 Remote 제어·자료 전환·백업 복구 시 위치를 보존한다.
- 승인: 사용자의 PRD v5 제품 완성까지 개발 요청에 따른다.
- 요구사항: PRD §11/24/25, FR-005/013/014. 원본 읽기 전용·바이너리 자동 영속화 금지.
- 완료 기준: 자산 소유권/형식/원본 대응 검증, 등록·재연결, 소유 Player 재생, 자료 전환과 새 Player/백업 복구, 실제 Whale 합성 음원·영상 검증.

## 영향 범위
- `src/adapters/pptx/assetModel.ts`, 새 `embeddedMedia.ts`: 소유 Blob 직접 조회·등록 UUID/원본 part 대응·외부 미디어 차단·한도와 취소.
- 후속 `src/media/types.ts`, validation/commands/storage: 원본 내장 자산의 안정된 식별과 위치 metadata. 바이너리·Blob URL 저장 금지.
- 후속 Editor/Player/Remote: 명시적 연결, 자동 재생 금지, 원본 영상 영역과 overlay 합성, 기존 소유권/epoch/checkpoint 재사용.
- 위험: 그룹 좌표·회전·효과 트리거를 단순 사각형으로 대체하면 원본 충실도 손실. 검증하지 않은 변형은 제한으로 고지한다.

## 단계
1. [x] 소유 자산 직접 추출 경계: 외부 URL 무요청, MIME/매직바이트/SHA-256 검증, 원본 part·요소 경로 대응, 읽기/개수/총량 한도·취소·자원 해제 단위/Whale 검증.
2. [x] 안정된 내장 출처 metadata와 strict 저장/공개/백업 계약, 같은 원본 재연결 시 정확한 자산 대응 함수. 실제 UI/vault 재연결은 단계3/4에서 검증한다. [근거](../pptx/EMBEDDED_MEDIA.md)
3. [x] Editor 명시적 내장 연결·실패/취소·중복·비공개 탐색 보호. 869tests/빌드·실제Whale1791828240243 제품버튼·읽기보류취소/실패·같은출처재연결·다른발표쪽불변·Enter/5viewport PASS. 부분ACK취소/16개한도는단위검증. [근거](../pptx/EMBEDDED_MEDIA.md)
4. [ ] Player 소유 재생/원본 영역·Remote 제어·전환·종료·새 Player 복구. 원본 트리거와 수동 제어의 지원 수준 구분.
   - 2026-10-13 수동 경로: runtime 소유 원본 재추출·기본 영역 foreignObject/native portal·Remote/자료교차·새Player/백업/현재종료 실제Whale1791829184123 PASS. 890tests/빌드. 원본 trigger·crop/clip/reflection·실제 그룹/회전/효과 동시 재생 인수가 남아 전체 체크는 유지한다. [범위](../pptx/PLAYER_MEDIA.md)
5. [ ] 실제 Whale 합성 WAV/MP4와 교사 원본 불변/기존 회귀. TEST_RESULTS/매트릭스/인수인계 갱신.

## 열린 검증
- 2026-10-13 동시 실행 검증: 실제Whale1791830666738 제품Remote 클릭→영상target90도회전/crop+ellipse/동일native연속재생·checkpoint1·새Player회전/clip/1.434132초정지복원 PASS.909tests/빌드/내장전체회귀PASS.원본trigger/다른고급조합은미완료,다음은[타이밍계획](2026-10-13-pptx-media-timing.md).
- 2026-10-13 후속 완료: srcRect 양의 crop(남는 가로/세로 각1% 이상)과 안전한 SVG shape path를 native 영상에도 적용했다. 실제Whale1791829563020 제품UI 합성crop+ellipse 픽셀 PASS/1366캡처 직접확인,901tests/빌드·PPTX/foundation회귀PASS. 음수/과도 crop·reflection은 후속 제한이다. 단계4/5 전체 완료는 아니다.
- 2026-10-13 worker 후속: actualWhale1791829859596에서 내장영상 native동일노드·소유권을 worker stopped→running에도 유지했다(.108241→.276801초/paused=false), 재시작 뒤 Remote 정지도 PASS. 강제프로세스종료나 crash시험은 아니다.
- 2026-10-13 repaint 실패 보완 완료: 전체 slot 대상·transform을 이동 전에 검사한다. 실제Whale1791830114932에서 뒤쪽target 누락 오류에도 이전SVG/native동일node .36494→.546019초 재생 PASS. 제품 내장영상 worker stopped→running 동일node/소유권/재생·이후Remote정지,자료읽기중revision증가→등록/발표보존 PASS.69파일909tests·빌드/foundation회귀PASS. 원본trigger/고급조합/진행중미디어추가는미완료.
- 4단계 설계: runtime이 이미 소유한 guarded 모델/Blob을 재사용해 현재쪽 미디어를 정확히 재추출한다. 영상은 해당 data-el의 SVG foreignObject에 기존 LocalMediaPlayer를 portal로 넣어 원본 요소의 그룹/회전/쌓임/효과를 따른다. repaint는 연결된 새 SVG로 moveBefore하여 native 재생 노드를 보존한다. crop/clip/reflection 등 미검증 변형은 명시적 오류로 남기고 global 영상으로 대체하지 않는다. 같은 checkpoint의 unrelated revision마다 재렌더하지 않는다. 실제 웨일 연속성/픽셀/재시작 검증이 필요하다.
- 실제 교사 원본에는 내장 미디어가 없다. 합성 미디어 시험을 교사 원본 충실도 근거로 합치지 않는다.
- 원본 그룹 변형/영상효과/타임라인 및 물리 스피커·포커스 지속성은 별도 검증한다.
