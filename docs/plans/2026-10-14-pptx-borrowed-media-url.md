# PPTX 미디어 URL의 검증된 공유와 수명

- 목표: 같은 Player 모델의 owned 미디어와 LocalMediaPlayer가 만드는 별도 BlobURL의 중복 관리를 제거하고 현재 재생·충실도·원본을 유지한다. 원본/모델/미디어 전체 byte 예산으로 가는 첫 단계다.
- 근거: 직전 관측의Player ownedURL92,769,395→149,548,498bytes(긴MP3 56,779,103bytes 추가). URL size 합계는 실제 물리복제를 증명하지 않으므로 두 수치를 분리한다. PRDv5 §11/16/24/28/30·IMPL-T-28.
- 방식: guarded source에서 준비/해시/geometry/원본binding을검증한미디어URL만대여한다. source lease에 retain을추가해부모runtime해제뒤에도native borrower가src를비우기전URL을revoked하지않는다. 마지막borrower/owner만dispose한다. released source의재입장은금지한다.
- Runtime은동일ref/fingerprint/origin의대여factory를안정적으로재사용해revision/settings 변경이native재생을재시작하지않게한다. LocalMediaPlayer는대여URL을직접revoke하지않고native pause/src비우기후lease를해제한다. 일반로컬파일의ownURL경로는유지한다.
- 위험: 늦은resolve/부모dispose·borrower중복해제/유실,미확인URL/변경ref의재사용,새factory로인한재생재시작. binding/Blob ownership/live signal을acquire때재검사한다. API/DB/public snapshot·권한/의존성·원본/코덱/preload/품질은변경하지않는다.

## 단계
1. [x] source retain/borrow factory·Live/identity/ownership·최종해제·일반URL보존unit/빌드.
2. [x] actualWhale 내장/native/source5·같은DOM/reprepare/취소·최종owner·현재PDF/원본보존과URLbytes 관측.
3. [x] 단일teacher-02WorkingSet과제품/PDF회귀·문서/인수인계갱신. origin ready/current/pending byte예산/입장정책·전체PRD인수는계속남긴다.

최종1,412tests/빌드·actualNative/일반localURL·원본보존·22URL/bytes불변과WorkingSetFAIL은[증거](../pptx/BORROWED_MEDIA_URL.md)를따른다. 이체크는URL수명개선범위이며전체자원예산/성능인수완료가아니다.
