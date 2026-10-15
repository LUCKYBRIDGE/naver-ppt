# PPTX 프로세스·미디어 자원 비용 분리

- 목표: 수업 화면·미디어·원본 충실도를 유지하면서 대용량 메모리 기준 실패의 비용 위치와 해제 수명을 증거로 분리한다.
- 승인 근거: 지속 개발 요청과 최신 인수인계. PRD v5 §11/16/24/28/30·FR-003/008·IMPL-T-28.
- 완료 기준: 기존 정상 Remote 경로에서 종류별 WorkingSet/PrivateMemory·자산/native·해제 후 시간 표본, 원본hash/재생/정지/PDF복귀 결과를 함께 보존한다. 기존1.5GiB 기준과 기능 인수를 유지한다. 관측만으로 제품 성능 개선을 선언하지 않는다.

## 영향 범위와 가설

- `scripts/verify-whale-pptx-entry-limit.mjs`: 기존 합계 표본을 CDP 확인된 프로세스별·종류별 숫자로 확장하고 private raw/표시 자산 해제 후 bounded idle 표본을 추가한다. 제품 실행 코드는 변경하지 않는다.
- `src/player/LocalMediaPlayer.tsx`, `PptxView.tsx`, `adapters/pptx/runtime.ts/embeddedMedia.ts`, `media/source.ts`: 읽기 검토. 현재 embedded source File로 LocalMediaPlayer가 별도 BlobURL을 생성한다. URLbytes가56,779,103 증가하지만 browser Blob backing 공유 여부나 실제 물리복제는 이 수치로 확정할 수 없다.
- 기존 최종 raw/backing9,335,184bytes, Editor/Player CDP값 동일·공유 renderer, ownedURL해제0과1.712GB WorkingSetFAIL이 공존한다. JS heap 합산·자산URLbytes=물리메모리 가정·누수 단정·강제GC/품질저하를 피한다.
- 위험: 관측 과정의 CPU/PowerShell 비용과 시점 차이, 종료 Worker 누락, Shared WorkingSet 중복계산. 시간 표본은 hard peak나 장시간 인수가 아니다. 프로세스 ID만 수집하며 명령줄·이름·본문·노트·원본bytes를 로그에 남기지 않는다.

## 단계

1. [x] 프로세스별 WorkingSet/PrivateMemory·종류 집계/합계 일치 검증과 해제 후 표본을 격리 verifier에 추가한다.
2. [x] 동일teacher-02 원본·정상 UI·기존 기준에서 실제Whale 측정하고 비용 위치/불확실성을 기록한다. 관측 timeout만으로 실행을 재시작하지 않는다.
3. [x] 확인된private scratch만소비하는좁은수정과unit/Whale회귀를실행했다. 전체WorkingSet은FAIL이며원인전체/최종성능해결을체크한것이아니다.
4. [x] 결과/호환성/기술 실험/인수인계와 계획을 갱신한다. Stage A~G·성능/물리·원본앱10종 최종 목표는 유지한다.

최종1,387tests/빌드·실제Whale기능/52쪽pixel회귀·모든성능FAIL과미실시인수는[증거](../pptx/PRIVATE_BUFFERS.md)를따른다.

## 열린 질문

큰 비용이 renderer/private parser 할당, browser Blob 저장, GPU 또는 native media 중 어디에 있는가? 해제 후 자연 회수되는가? 이 답을 얻은 뒤 다중자료/창 admission·active/pending 모델 예산을 설계한다.

첫관측1791970098053은기능/원본보존PASS·기준FAIL(1,731,231,744bytes), peak renderer합계1,143,943,168/browser399,634,432bytes. URL해제뒤5초전체1,713,364,992bytes·renderer1,132,052,480bytes다. 프로세스비용은분리됐으나JSheap약20MB만으로ArrayBuffer/native비용을판정할수없어CDP Runtime.getHeapUsage의backingStorageSize/embedderHeapUsedSize를단계관측에추가한다. 창별독립으로합산하지않으며강제GC/heap본문snapshot은사용하지않는다.

## 근거 후 좁은 수정 후보

두번째1791970216650은WorkingSet1,748,860,928bytes FAIL·최종해제뒤5초backingStorage242,131,622bytes. 단순 raw 참조 삭제와Blob 생성 뒤 private parser asset ArrayBuffer가즉시소비되지않는코드경로를확인했다. source소유가확정된임시buffer에만ArrayBuffer.transfer(0)를적용해detached/0길이로소비한다. API부재면기존참조해제동작유지,사용중인공유뷰/다른part참조에는적용하지않는다. default helper의비소비계약을유지하고source가명시opt-in한다. guard/hash/스트림대조/Blob생성이완료된뒤만소비하고File/표시Blob/다른owner·모델/타이밍근거는보존한다. raw/asset소비unit과실제Worker·원본/화면/native회귀·메모리를검증한후원인기여를판정한다. 이것을전역budget/최종성능해결과혼동하지않는다.

첫 버퍼 소비 수정1791970476981은해제뒤5초backingStorage2,701,966bytes/WorkingSet1,266,507,776bytes까지낮아졌으나peak1,625,133,056bytes로기준FAIL. 미디어쪽준비의backing증가56,781,317bytes는MP3크기와거의같고readMediaInput은immutableFile.arrayBuffer에서헤더/해시를읽은뒤scratch를소비하지않는경로다. format중립 `shared/privateBuffer.ts`로작은소비함수를이동하고media/input의읽기성공·header/digest실패finally에서만해당read의새buffer를소비한다. 반환값은숫자/metadata뿐이고File·재생Blob·rawpackage에대한직접접근은없다. 원본File불변/재시도와scratch소비unit을추가한뒤다시측정한다.
