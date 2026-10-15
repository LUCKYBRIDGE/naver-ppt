# Player 빠른 편집 진입
- 목표: 발표 중 우클릭/길게누르기/편집아이콘에서 현재페이지의 독립 Editor를 열되 발표는 유지한다. PRD v5 §13/StageB, FR-005/006.
- 완료 기준: Player 전용 좁은 요청/currenttarget·revision·sender수업 검증, strict Editor선택commit 후 창재사용, 공개응답만, 발표/델타·기존Editordraft 보존, 실제Whale 검증.
- 하지 않는 것: Player raw 편집/노트 권한 부여, 발표선택 변경, Editordraft삭제, 원본객체편집, 물리터치인수 대체.
## 영향 범위
- OPEN_CURRENT_EDITOR 별도request와SessionHub currenttargetgate/internalSELECT_EDITOR_SLIDE, background senderquery/session일치검사→manager.open(editor).
- Player 선택된PDF에서 작은편집아이콘/우클릭/600ms touchlongpress; move/up/cancel/새페이지에서timer취소. private정보/오류본문은Player에배포하지않는다.
- Editor는기존선택held draft정책을사용, 다른창미확정draft가있어도unmount/자동commit하지않는다.
## 단계
1. [x] 요청/core선택/창경계·권한·중복·stale 테스트. DB 실패는 기존 SessionService strict 경로이며 추가실패실기기 인수는 남음.
2. [x] Player진입UI/포인터cleanup·접근성. Escape와 이동8px/up/cancel/leave/페이지변경 cleanup, 물리터치는후속.
3. [x] check182테스트/actualWhale 창재사용·현재선택·발표불변·Editordraft보존/문서. 합성longpress를물리터치보장으로확대하지않는다.
## 결정
- 기존포괄개발승인적용, 새패키지/권한없음. window실패시Editor선택은캡처페이지로남을수있으나발표/델타는변경하지않는다.
