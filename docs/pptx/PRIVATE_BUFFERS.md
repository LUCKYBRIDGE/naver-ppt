# Private 임시 버퍼 소비와 프로세스 관측

PRD v5 §11/16/24/28/30·FR-003/008·IMPL-T-28. [계획](../plans/2026-10-14-pptx-process-memory.md). 전체 메모리 기준 실패를 분리하는 관측과 확인된 임시 버퍼 수명 개선이다. 전역 admission·최종 성능 인수는 미완료다.

## 구현 경계

`shared/privateBuffer.ts`는 읽기·검증을 마친 private ArrayBuffer에만 선택형 `transfer(0)`을 적용한다. API 부재/실패는 기존 참조 해제 동작으로 남긴다. File 또는 Blob snapshot을 수정하지 않는다.

PPTX source는 parser asset으로 Blob을 만들고 모델 참조 hydration이 모두 성공한 뒤 해당 임시 buffer를 소비한다. helper의 기본 호출은 caller bytes를 보존하고 실제 source만 opt-in한다. raw 항목은 원본 hash/size와 owned Blob의 정확한 바이트 대조 후에만 소비하며, 다른 package part/subview가 같은 buffer를 참조하면 유지한다. 마지막 source lease 해제는 남은 private raw를 비운다. XML/폰트/관계는 사용 중에 보존한다.

미디어 입력은 플랫폼 File.arrayBuffer가 반환한 해당 읽기의 scratch만 헤더/해시 확인 성공·실패 뒤 finally에서 소비한다. 반환 metadata·성공 identity cache·immutable File·재생 Blob은 유지한다. 원본 파일·DB/RPC·권한/의존성·코덱·품질/재생/preload 정책 변경은 없다.

## 관측 방법

격리 `verify-whale-pptx-entry-limit.mjs --media64`는 CDP가 확인한 프로세스 ID의 WorkingSet64/PrivateMemorySize64를 읽기 전용 PowerShell로 기록하고 종류별/합계 일치를 assertion한다. 종료된 프로세스의 누락 개수를 명시한다. 전체 프로세스 command line·자료 이름/본문은 수집하지 않는다. 기존1.5GiB 기준은 동일하며 최종 peak는 주기 표본과 phase 표본의 최대다.

phase마다 Runtime.getHeapUsage의 backingStorageSize/embedderHeapUsedSize와 기존 JS heap/DOM/native/ownedURL 숫자를 함께 기록한다. Editor/Player가 공유 renderer이면 같은 heap 결과를 합산하지 않는다. 마지막 자산 해제 뒤1초/5초의 자연 회수 표본을 추가하며 강제 GC·heap 본문 snapshot·원본 외부 전송은 없다. WorkingSet 합계에는 shared resident page의 중복 집계 가능성이 있고 PrivateMemorySize64는 resident 값이 아니다. 이 방법은 hard peak·누수 확정·저사양/장시간 인수를 보장하지 않는다.

## 실제 관측

Windows/Whale5.39.412.57 headless, teacher-02 PPTX/paired PDF 읽기 전용. 결과는 ignored `node_modules/.cache/whale-pptx-entry-limit/<실행>/result.json`이다. 모두 원본 두hash 불변·외부0/pageerror0·등록/표본화면/parser1/MP3읽기1·실제muted재생/정지/PDF복귀가 작동했으며 **전체 WorkingSet 기준은 모두 FAIL**이다.

| 실행/범위 | 전체 최대 WorkingSet | 주요 관측 |
|---|---:|---|
| 1791970098053: 종류별 비용 | 1,731,231,744 | peak renderer합계1,143,943,168/browser399,634,432. URL해제뒤5초전체1,713,364,992bytes. |
| 1791970216650: backing 관측 추가 | 1,748,860,928 | 미디어쪽 backing240,204,143·해제뒤5초242,131,622bytes. |
| 1791970476981: private parser/raw 소비 | 1,625,133,056 | 미디어쪽 backing113,925,532·해제뒤5초2,701,966/전체1,266,507,776bytes. 첫 소비 수정의 기능/Worker 공유도 확인했다. |
| 1791970627466: media hash scratch 소비까지 | 1,754,501,120 | 미디어쪽 backing57,146,816·해제뒤5초40,403,927/전체1,737,003,008bytes. 미디어준비 약56.8MB backing 감소와 전체WorkingSet FAIL이 함께 존재한다. |

비용의 큰 부분이 renderer에 있다는 것은 확인했지만, backing storage 감소를 전체 native/renderer 비용 감소나 성능 기준 해결로 확장하지 않는다. 자연 GC/할당/시점 차이가 있고, 소스별 scratch 원인을 좁힌 근거와 전체 프로세스 성능 판정을 분리한다. 가장 낮은 중간 표본만 선택해 완료라 하지 않는다.

## 자동 검증과 남은 것

check18:36:48 exit0 **99파일/1,387tests·TypeScript/Vite/MV3/5스킬 PASS**. 신규12개는 private opt-in/default bytes·다른 part/subview 보존·API 부재/실패·Blob snapshot·중복 asset identity·hash/size근거와 미디어 헤더/해시 성공·실패의 scratch 소비/File불변·재시도를 확인한다.

최종 기능 회귀는 모두 exit0/종료다. 결과 경로는 같은 ignored cache 아래 각 이름/실행 번호를 따른다.

| 검사 | 최종 실행/결과 |
|---|---|
| whale-pptx-source-sharing |1791970913178 PASS. 실제 native Worker1·transfer API지원·동시 owner/개별취소/전체abort·재시도/최종 자산·raw해제·현재PDF/수업/원본hash 보존. productRendering=false. 첫 parser/raw 소비1791970522173도PASS. |
| whale-prepared-scene |1791970679795 PASS. 실제 준비/취소/실패·현재화면/음원·worker/ACK유실·누락/재연결·닫힌명시쪽·직접우회거부. |
| whale-pptx-player |1791970679795 exit0. 교사23쪽/12효과·private/draft/overlay·worker/새Player·백업/재연결/5화면·원본불변/errors0. 다른시험폴더이므로준비시험과번호가같아도동일실행이아니다. |
| whale-pptx-embedded-media |1791970874893 exit0. actual native WAV/MP4·crop/rotation/효과 공존/동일DOM·원본타이밍/source5·metadata오류/취소·백업·worker/교체Player·원본불변/외부0/pageerror0. |
| whale-foundation |profile-1791970885015/verification-result.json PASS. PDF복사본/저장확인·원본/종료/복구·owner/worker·WAV/MP4/자동넘김. OSchooser/물리/가청출력은별도. |
| whale-pptx-visual |1791970923260/result.json executionPassed=true. 전체52쪽720×540·원본두hash불변/errors0. pixel-regression.json은기준1791912346260과decodedRGBA52/52쪽동일PASS. 기준PDF/폰트차이·원본앱기준환경/최종Visual인수는미완료. |

내장 첫1791970680239의효과공존검사는 `combined-effect-observation.json`의currentTime2.134767/paused=true로실패했다. 기존fixture metadata의duration2.134767과정확히같은자연종료였으며동일node/회전/crop은유지됐다. 해당coexistence변형에만nativeCanvas/MediaRecorder로12초합성MP4를생성하고duration>10/ended=false·paused=false·위치진행/동일node를모두확인했다. canonical2초fixture·자연종료checkpoint검사·제품재생/원본은변경하지않았다. 합성fixture 생성은파괴적작업/원본변환이아니다.

원본 앱 환경의 실제10종(현재2/PDF1) Visual/Media/Behavior·물리 교실/가청 출력·장시간/cold offline, 서로 다른 자료/창의 active/pending 모델 자원 입장, 실패 준비/통신 경합·PDF 대안·Quick Launch/legacy/web와 전체 Stage A~G 최종 인수는 남는다. 실제 source/모델/미디어를 현재 발표 중 강제로 evict하거나 품질을 낮추지 않는다.
