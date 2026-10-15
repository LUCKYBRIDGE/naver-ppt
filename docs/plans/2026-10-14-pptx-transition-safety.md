# PPTX 준비 검사 후 리모컨 전환

- 목적: PRDv5 §8/24/30, FR-004/008, IMPL-T-28. 알려진 미지원 쪽으로 전환해 학생 화면이 비는 문제를 리모컨의 정상 사용자 동작에서 막는다.
- 승인 근거: 제품 완성 지속 개발·인수인계의 미지원 쪽 학생 화면 보호 우선 과제.
- 현재: 등록 사전검사는 회전/확대 실패를 알리지만 Remote가 즉시ACTIVATE/GOTO/REOPEN을 보내고 Player는기존표면을지운뒤준비하다실패한다.
- 구현: Remote에서PPTX 목표ID/원본지문을확인하고기존guarded모델·실제engine binding/완료checkpoint·안전SVG를학생화면과분리된DOM에서검사한다. 효과/미디어는실행하지않으며finally해제한다. 실패/취소시전환명령없음·안내/명시적재시도. 성공후최신세션의현재발표/목표·지문/닫힘/복원쪽이같은지재검증하고최신revision으로1회명령을보낸다. unrelated편집/재생checkpoint revision은허용하고선택경합은거부한다.
- 경계: 이번은정상RemoteUI의선행검사이며background/core의모든직접명령을차단하는receipt는아니다. Player의실제창/복구·자산/미디어준비실패까지보호하는staging/commit과대안PDF연결은미완료다. 원본충실도/원본자동타이밍pass로해석하지않는다.
- 상태/권한/의존성/schema/원본변경없음. 취소·창닫기에서늦은명령금지,현재자료미디어를준비중정지하지않는다. 원본참조는기존vault,추가파싱/메모리비용은필요시만발생하고종료시자산해제한다.
- 실제UI검증준비중확인한경로보완: 첫쪽이실패하는자료의정상쪽으로갈수있도록 ACTIVATE_DOCUMENT의기존slideId를null(기억쪽)또는명시쪽으로허용한다. selector/validator/core/Remote모두같은목표를사용하고한번의commit으로전환한다. 닫힌자료는기존명시다시발표경로를유지하며SELECT_EDITOR/원본은변경하지않는다. 세션/백업schema변경없음.

## 검증
1. [x] 대상해석·경합/취소·최신revision단위시험과기존engine/SVG검사adapter.
2. [x] Remote전체전환UI 연결·진행/취소·명시적대안안내.
3. [x] 전체check·실제Whale합성미지원/PDF픽셀·세션유지/다음쪽성공/회귀/5화면,원본·권한보존.
4. [x] 문서·인수인계와남은완전전환인수갱신.

## 구현 결과와 남은 전체 전환 인수
- 최종08:11:11 check:93파일/1,324tests·타입/Vite/MV3/5스킬PASS. adapter는전체기존runtime와source-v1복원을재사용하고검사용snapshot의과거run/request를제거한다. 기존transport.send/newId를사용하고오직전송전실패에화면유지확정을안내한다.
- actualWhale degradation1791933132393/교사제품1791933009519/최종내장1791933139442/foundation profile-1791933010227 모두exit0. 완료source5그룹의Remote준비검사후실제revision수락/위치보존도확인했다. [실행기록](../TEST_RESULTS.md).
- 이계획의정상UI선행검사는완료했지만전체안전전환은미완료다. 다음은Player가현재표면/미디어를유지한채목표를준비하고검증된요청/receipt로commit하는절차를설계·구현한다. 직접명령/원본누락·변조·worker실패·취소/창닫기·재시작/소유권/복원·닫힌자료의다른정상쪽선택을포함한다. 대안PDF연결/자동재생중지·위치보존과대용량추가파싱/메모리도인수한다. 실물10종·원본앱·물리/최종Stage인수는계속남는다.
