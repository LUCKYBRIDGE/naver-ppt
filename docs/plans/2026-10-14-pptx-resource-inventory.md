# PPTX source 수명별 숫자 자원 집계

- 목표: 준비 job/ready source/lease의 수명과 logical 보유량을 분리해 전체 byte 입장 예산의 근거를 만든다. 현재 발표·원본·품질은 유지한다.
- 범위: sourceModel의 작은 숫자 registry. File/Blob/모델/파일명/본문/지문은 registry에 저장하지 않는다. 같은 ready source의추가lease/borrower는source bytes를늘리지않고lease수만늘린다. raw backing buffer/owned Blob alias는source내identity로중복제외한다.
- 한계: queued/preparing file size는입력후보/예약량이고실제RAM이아니다. ready raw/Blob은logical값,model JS heap/native/allocator/SourceVault원본전체·다른창합계는미측정이다. 임의hard physical상한을선언하지않는다. 원본/모델전체예산의첫관측단계다.
- lifecycle: queued→preparing→ready,전체취소는cancelling으로남겨실제읽기/작업이끝날때까지유지. 실패/late결과/마지막owner해제는record삭제. numeric snapshot은복사본이며추적용token을외부에노출하지않는다.
- PRDv5 §11/16/24/28/30·FR-003/008·IMPL-T-28. 지속개발/최신인수인계가승인근거. DB/RPC/publicsnapshot/권한·원격전송·텔레메트리없음.

## 단계
1. [x] 숫자측정/registry/source수명연결·alias/lease/cancel/실패/최종해제unit·빌드.
2. [x] 실제Whale source/nativelease·2popup·현재PDF/원본과최종0/준비취소를확인.
3. [x] 관련제품회귀/문서/인수인계갱신. origin합계/입장예산·단일WorkingSetFAIL·전체PRD인수는계속남긴다.
