# PPTX 준비·미디어 자원 사용 개선

- 목표: 현재 학생 화면/재생과 원본 충실도를 유지하면서 대용량 준비·전환·미디어의 메모리 비용을 제한하고 실제 Whale 증거로 확인한다.
- 승인 근거: 제품 완성 지속 개발·PRD v5 §16/24/28/30 및 준비 전환 계획5단계. [현재 두 실패와 단계 관측](../pptx/TRANSITION_ADMISSION.md).
- 완료 기준: 같은 teacher-02 입력/정상 Remote 경로의 기존1.5GiB 실험 기준, 준비/재생·정지/PDF복귀 및 원본hash/현재 화면 보호를 함께 확인한다. 표본 성공만으로 hard peak/저사양/전체 성능을 확정하지 않는다. 한도/조건 변경이 필요하면 근거를 별도 결정하고 실패를 지우지 않는다.

## 관측과 영향 범위

- 기존 결과 최대1,640,394,752 및1,620,353,024bytes, 둘 다 FAIL. 두 번째는 단계/CDP 관측 추가. 첫 쪽 확정 약1.47GB→미디어 쪽/음원 재생/복귀 근처 약1.62GB. source File 공유와 Editor Blob 해제0은 확인했으나 전체 native/외부buffer/retained 메모리 원인은 미확정이다.
- 읽을 코드: player/LocalMediaPlayer.tsx·PptxView.tsx·preparedScene.ts, adapters/pptx/sourceModel.ts·assetModel.ts·embeddedMedia.ts·runtime.ts·sourceMediaCalls.ts, media/input.ts. File/원본 bytes/모델과 native preload의 소유권 및 크기·수명 경계를 먼저 확인한다.
- 초기 실험 후보: 준비 native preload=auto가 최소 data 준비 이후에도 전체 긴 미디어를 버퍼링하는지 관측한다. 필요 구간 준비 후 metadata 힌트로 낮추는 방식은 동작/readyState/seek·첫 재생 연속성까지 시험한다. 검증 전 채택하지 않는다.
- 위험: readyState만 만족시키려다 seek/재생 가능 상태를 잃는 것, 늦은 media 이벤트의 재생/쓰기, 현재/목표 모델 중복 파싱, 취소 시 다른 사용자의 source 해제. source-v1 checkpoint/동일 DOM/native 승격을 유지한다.
- 보존: 원본 축소·재인코딩·화질/음질 저하·효과 생략·강제GC·실험 한도 상향·자동 원본 영속 복제·추가 서버/권한/의존성으로 우회하지 않는다.

## 단계

1. [x] 단계별 native buffered/preload/readyState와 asset/source 소유권·크기/읽기 횟수를 시험 코드에서 측정한다. CDP heap은 공유 renderer일 수 있으므로 창별 독립으로 해석하지 않는다.
2. [x] 원인이 확인된 중복/선행 버퍼링·불필요 소유권만 좁게 수정하고 취소·재사용·해제 경합 단위 테스트를 추가한다.
3. [x] 실제 Whale 같은 자료/조건의 준비/음원/복귀·메모리와 교사/내장/source5그룹/미지원/PDF 회귀를 확인한다. 실패하면 원인을 다시 분리하며 같은 방법을 반복하지 않는다.
4. [x] check·결과/호환성/저장정책/인수인계 갱신. 성능/물리/장시간·실제10종/원본앱·Stage A~G 전체 인수는 요구 범위 그대로 유지한다.

실행 결과: [관측/중간 실패/수정 후 두 표본·최종 회귀](../pptx/SOURCE_REUSE_MEMORY.md). 97파일/1,362tests·빌드 PASS, teacher-02 parser4→1/MP3읽기3→1, 수정 후 최대1,600,827,392 및1,581,264,896bytes로 기존1.5GiB 실험 기준 통과. 이 계획은 해당 중복 원인 개선/시험 범위이며 전역 자원 예산·hard peak/저사양·장시간/전체 성능 인수를 완료하지 않았다.

## 관측 후 수정 방향

- 읽기/Worker/native 숫자 관측1791938834124: Player presentation parser1회, Editor1/26/52/3쪽 탐색 중4회·동일98MB File 읽기5회. OverlayEditor의쪽별key가RegisteredPptxPreview를재마운트하면서마지막source lease를해제해재파싱한다. 모델을한개자료수명으로유지해기존쪽별draft초기화경계는보존한다.
- Editor에서선택한PPTX자료하나의source lease를별도로유지하고준비된뒤기존OverlayEditor/RegisteredPptxPreview를표시한다. 페이지가바뀌어도lease를유지,자료/수업/지문·등록쪽집합변경/창닫기는해제한다. 준비중취소/늦은성공은즉시dispose하고실패는원본재연결로다시준비한다. WeakMap의동일File ready공유를재사용하며새전역캐시/retention타이머를만들지않는다.
- native MP3는loadedmetadata시점에이미전체3547.92초buffered를보고했다. loadeddata뒤preload변경으로전체버퍼를줄인다고가정하지않고이번수정에서는native재생정책을유지한다. Editor재파싱수정후남는비용을다시측정한다.
- 같은guarded Blob을미디어등록/원본설정점검에서각각File로만들고,metadata probe가같은File을다시hash하여Editor MP3전체읽기가3회였다. 동일Blob의성공한File/identity와동일immutable File의성공한signature/hash숫자만WeakMap으로재사용한다. 참조/모델/소유권검증은매번유지,다른File/Blob·형식변경·실패는재검증한다. rawbytes/persistentcache/재생권한은저장하지않는다.
