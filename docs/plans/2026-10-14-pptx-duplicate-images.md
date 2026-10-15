# 검증된 중복 raw 이미지 버퍼 해제

- 목표: 원본 guard/hydration/recovery 이후, 현재 owned 이미지 Blob과 바이트가 같은 raw package 이미지의 중복 버퍼만 해제해 현재 발표/원본 충실도를 보존한다.
- 승인: 지속 개발·인수인계의 raw/hydrated 중복 과제. PRDv5 §7/11/16/24/28/30·FR-003/008·IMPL-T-28.
- 알고리즘: 지원 raster 이미지와 작은 미디어 경로/크기 제한 안에서 raw와 같은 MIME·크기의 owned Blob을 스트림으로 정확히 바이트 대조한다. raw SHA256·size 근거를 보관하고 Blob 정체성/소유권을 해제 직전에 다시 검사한다. 성공한 항목만 raw 참조를 제거하며 다른 bytes·미확인/변환 이미지·fonts·XML/rels는 유지한다. source 최종 owner 해제는 남은 private raw files도 비우고 표시 Blob/원본 File은 각 수명 계약을 따른다.
- 위험: 같은크기만으로다른이미지삭제/다른owner의자산해제·취소/실패뒤부분입장·미디어hash근거손실. core/DB/publicschema/원본파일/권한·의존성/preload/화질·음질변경없음.

## 단계
1. [x] helper/source연결과동일크기다른bytes·owned여부/취소/실패·다른형식보존·최종raw해제unit검증.
2. [x] 실제Whale teacher01/teacher02의raw절감·원본hash/화면·미디어/효과·메모리/실패대안/취소회귀를확인. 메모리 기준 FAIL을 보존하며 성능 해결로 체크한 것이 아니다.
3. [x] check·검증/호환성/저장정책/인수인계갱신. 다중자료/창budget·physical/전체충실도/StageA~G목표유지.

최종 범위·중간 실패·1,375tests/빌드·실제Whale 기능 회귀·52쪽 pixel 회귀와 성능 FAIL은 [증거](../pptx/DUPLICATE_PARTS.md)를 따른다. 지원 승격/전체 성능 인수는 미완료다.

## 관측에 따른 작은 미디어 확장

teacher-02에서ownedPNG/JPEG와일치한이미지는5개/1,384,852bytes였고,owned음원은17개/91,384,543bytes다. 큰MP3 56,779,103bytes는기존근거/해제에포함되나작은음원들의raw약34.6MB는중복보유했다. 같은exact ownedBlob hash대조를32MiB이하mp3/wav/mp4/webm에적용한다. 기존 `largeMediaParts` 조회계약은큰미디어근거와작은검증미디어근거를합쳐유지한다. 모든XML/관계·타이밍·소유권/미디어종류/헤더guard를유지,unmatched/unknown은보유한다. 원본파일/표시Blob·코덱·재생/preload/품질을바꾸지않는다.

미디어확장첫실행1791968806169는1,711,390,720bytes로기준FAIL. Blob.arrayBuffer의전체대조버퍼도생기므로raw hash근거는그대로두고ownedBlob을ReadableStream으로정확한바이트대조한다. 통째Blob복사/digest입력을추가하지않으며reader는완료/다름/실패/취소에cancel/release한다. 바이트같음은hash같음보다강한동일성확인이고품질변환없음.
