# 검증된 중복 이미지·작은 미디어 참조 해제

PRD v5 §7/11/16/24/28/30, FR-003/008, IMPL-T-28. [계획](../plans/2026-10-14-pptx-duplicate-images.md). 원본 충실도·수업 연속성을 보존하면서 메모리 중복을 줄이는 작업이며, 전역 메모리 예산이나 최종 성능 인수는 아니다.

## 구현과 수명

`duplicateImageParts.ts`는 package guard, model hydration, embedded recovery가 완료된 source의 32MiB 이하 PNG/JPEG/GIF/WebP·MP3/WAV/MP4/WebM만 검사한다. 같은 MIME·크기의 owned Blob을 스트림으로 읽어 원본 raw와 정확히 바이트 대조한다. 전체 Blob arrayBuffer 복사를 추가하지 않는다. raw SHA256·size 근거를 보관하고 해제 직전 소유권·raw 객체 정체성을 재검사한다. reader는 성공·불일치·실패·취소에 정리한다.

일치한 raw 항목만 제거하며, 미확인·변환·불일치 이미지와 XML/관계/폰트는 보존한다. 작은 미디어 근거는 기존 `largeMediaParts` 조회에 합쳐 원본 관계·타이밍 바인딩의 크기/해시 검증을 유지한다. 표시/재생 Blob·원본 File은 유지하고 source의 마지막 lease 해제 때 남은 private raw files를 비운다. 다른 owner가 사용하는 source는 폐기하지 않는다. 실패 시 자산과 private raw를 정리한다. 원본 파일·DB schema·권한·의존성·코덱·화질·음질·재생 정책 변경은 없다.

## 확인한 증거

Windows, Whale 5.39.412.57 headless 격리 MV3 프로필. 모든 실행 결과는 ignored `node_modules/.cache/` 아래에 있다. 사용자 원본은 읽기 전용이며 내용·파일을 외부로 보내지 않았다.

| 검사 | 결과 |
|---|---|
| check 2026-10-14 18:12:31 | PASS, 98파일/1,375tests·TypeScript/Vite/MV3/5스킬. 신규 8개는 exact image/media·동일크기 다른 bytes/MIME·소유권 상실/실패/취소·chunk stream/arrayBuffer 미사용·blocked read 취소를 확인한다. |
| source-sharing/1791969314525/result.json | 최종 스트림 코드 PASS. teacher-02 이미지 5개/1,384,852bytes와 작은 음원 16개/34,605,440bytes 해제. 기존 큰 MP3 56,779,103bytes 근거/해제도 유지. 남은 raw bytes와 unique backing bytes 모두 9,335,184. 큰 backing buffer를 작은 view가 붙잡는 가설은 이 표본에서 확인되지 않음. |
| 같은 공유 검사 | 실제 제품 source/native Worker 1회·첫 소비자 취소 후 상대 유지·추가 owner/마지막 자산·raw 해제·전체 취소/재시도·현재 PDF/수업 보존·원본 hash 불변·외부 0/pageerror 0. productRendering=false이므로 렌더 충실도 증거가 아님. |
| prepared-scene/1791969513438/result.json | 최종 코드 PASS. 기존 화면/음원·취소/실패·worker/ACK 유실·누락/재연결·닫힌 명시 쪽·직접 명령 거부. |
| pptx-player/1791969513441/result.json | 최종 코드 exit0. 실제 교사23쪽/12효과·비공개 노트/편집/draft·현재 확정 반영·worker/새 Player 복구·백업/재연결·5화면. 원본 불변/pageerror 0. |
| embedded-media/1791969604720/result.json | 최종 코드 exit0. 실제 native WAV/MP4·crop/rotation/효과 공존·동일 DOM 승격·source 5그룹·취소/metadata 실패·worker/새 Player·백업. raw WAV 해제 후 바인딩 성공, 근거 누락/해시·크기 변조/raw bytes 변조 거부와 복구 확인. 외부 0/pageerror 0/원본 불변. |
| whale-foundation/profile-1791969661536/verification-result.json | 최종 PDF 회귀 PASS. 저장·검증된 복사본·원본보존/종료·owner/worker·실제 muted WAV/MP4·자동 넘김·정상 재시작. OS chooser/download·물리 모니터/가청 출력 인수는 별도다. |
| whale-pptx-visual/1791969671689/result.json | 최종 전체52쪽720×540 캡처 executionPassed=true·원본 두 hash 불변·errors0. 최종 원본앱 기준 환경/human review는 unverified다. |
| 같은 폴더 pixel-regression.json | PASS. decoded RGBA를 bgRef 수정 후 기준1791912346260과 대조해52/52쪽 전체 pixel 동일. 이번 변경의 화면 회귀 없음이며 기존 기준PDF 차이/글꼴·충실도 미완료를 해결한 것은 아니다. |

이전 image-only 공유 teacher-01 `1791968167132`는81개/5,884,884bytes, teacher-02 `1791968377899`는5개/1,384,852bytes 해제를 확인했다. 작은 미디어 확장 후 `1791968742380`도PASS. 최종 내장 검사 첫 실행 `1791969513575`는 이미 해제된 WAV raw가 있다고 가정한 시험 코드에서 실패했다. 원본 fixture bytes를 probe에서만 재주입해 변조 거부를 유지하고, 해제 근거의 누락/변조 검사까지 확장한 뒤 통과했다. 제품에서 raw 보유를 복원하지 않았다.

## 성능 실패와 남은 인수

전체 WorkingSet 표본은 image-only `entry-limit/1791968250797` 1,591,717,888bytes PASS였으나, 작은 미디어 whole-Blob 대조 `1791968806169`는1,711,390,720bytes FAIL, 최종 스트림 `1791969157618`도 **1,712,766,976bytes FAIL**이다. 기존1.5GiB 실험기준을 올리지 않았고 강제 GC로 통과시키지 않았다. raw 참조 해제량을 전체 프로세스 메모리 감소나 누수 해결로 해석하지 않는다.

최종 대용량 실행은 parser1/MP3 전체읽기1, 등록·표본화면·실제 muted 음원 재생/정지·PDF 복귀·Editor 추적자산0·원본 두 hash 불변·외부0/pageerror0이 작동했다. 성능 FAIL과 분리한 기능 증거다. 다른 자료/창의 admission·활성/대기 모델 예산, 비취소 입력 읽기의 일시적 수명과 native/renderer retained 메모리를 분리해야 한다. 현재 발표 source를 강제로 폐기하거나 충실도를 낮추지 않는다.

실제 교사10종(현재2종/기준PDF1종), PowerPoint 기준 환경의 Visual/Media/Behavior, 물리 교실·장시간/cold offline, PDF 대안·경합/장기 통신복구, Quick Launch/legacy/web, PRD Stage A~G 최종 인수와 지원 승격은 미완료다.
