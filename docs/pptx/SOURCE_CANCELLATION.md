# 원본 재연결 취소와 늦은 결과 보호

PRD v5 §6/11/14/16/24/28/30·FR-004/008·IMPL-T-28. [계획](../plans/2026-10-14-source-reconnect-cancellation.md).

SourceVault.get은 optional AbortSignal을 받고 요청별 controller로 handle 조회·getFile·validator·broadcast 대기를 감싼다. 취소/close는 소비자에게 즉시 AbortError를 반환하고 timer/listener/request를 정리한다. 늦은 결과는 cache/remember에 반영하지 않는다. 다른 소비자와 기존 cache는 삭제하지 않는다. 검증 중 더 새로운 원본이 연결됐으면 그 연결을 보존하고 이전 요청의 fingerprint가 다르면 거부한다.

PPTX validator에도 signal을 전달해 native 준비 gate의 대기를 취소한다. 실행 중 File 읽기는 실제 완료까지 gate reservation을 유지하며 readPptxInput의 취소/실패 scratch만 소비한다. 성공 반환 bytes와 원본 File은 보존한다. PPTX Player/선택자료/비공개 미리보기/내장 연결, PDF 표시/내보내기, 로컬 미디어 표시의 controller가 get까지 연결된다. PDF/media의 실제 읽기는 signal을 무시하고 끝날 수 있지만 늦은 vault/DOM 반영은 막는다. RPC/DB/schema·원본/권한/품질/재생 정책 변경은 없다.

## 검증 근거

Windows/Whale5.39.412.57 headless 격리 프로필. 결과는 ignored node_modules/.cache 아래다. 사용자 원본은 읽기 전용이다.

| 검사 | 결과 |
|---|---|
| check19:42:23 | exit0,101파일/1,403tests·TypeScript/Vite/MV3/5스킬PASS. 신규8개는 preabort cached 보존·handle/getFile/validator 늦은결과·다른소비자·broadcast timer/late reply·close·새원본을old validation으로덮어쓰지않는것을검사한다. |
| whale-prepared-scene/1791974738566/result.json | 최종PASS. 실제 Remote UI 준비 중 native gate를 잡아 uncached 원본 validator를 대기시킨 뒤 취소. queued request 제거·PPTX읽기0/Worker0·현재PDF/실제mutedWAV진행 보존. 기존 실패/응답유실/worker/누락·재연결/닫힌명시쪽 회귀도PASS. |
| whale-pptx-source-sharing/1791974287604/result.json | PASS. 실제native popup2창·독립File/nativeWorker/WebLocks에서 source/import/inspection/identity/vault 5종 queued취소·읽기0/Worker0·재시도·active읽기완료까지예약·실패/닫힘/API부재·owner/현재PDF/원본hash 보존. productRendering=false. 최종 caller 확장 전 source/get 코드이며 이후 추가한 PDF/media caller는 아래 제품회귀로확인했다. |
| whale-foundation/profile-1791974738725/verification-result.json | 최종PASS. PDF복사본/저장확인·취소/원본·종료/복구/owner·WAV/MP4·자동넘김/정상재시작. |
| whale-pptx-embedded-media/1791974738719/result.json | 최종exit0. 내장 WAV/MP4·crop/rotation/효과/동일DOM·source5·metadata오류/취소·worker/교체Player·백업/재연결·원본불변/외부0/pageerror0. |
| whale-pptx-player/1791974738571/result.json | 최종exit0. 실제23쪽/12효과·비공개편집/노트/draft/overlay·응답실패·worker/새Player·백업/재연결/5화면·원본불변/pageerror0. |

초기7개신규unit 중broadcast시험은reply 객체에 request.type이뒤에서덮여timeout했다. 실제reply형식으로spread순서를고친뒤통과했으며제품프로토콜을약화시키지않았다. 초기1,402tests/준비1791973948733·공유1791973948848,새연결보호후준비1791974287474/PDF profile-1791974287605/내장1791974287615도PASS. 최종위표는PDF/media caller확장뒤검증이다.

이번작업에서성능기준을상향하거나강제GC/품질저하를하지않았다. 단일teacher-02의마지막측정은직전준비gate버전1791972762706의1,794,793,472bytes FAIL이며이번취소수정의메모리통과근거로사용하지않는다. ready/current/pending 원본·모델·미디어 byte예산,실제교사10종(현재2/PDF1)·원본앱Visual/Media/Behavior·물리/장시간/coldoffline·PDF대안/통신경합/QuickLaunch/legacy/web·전체Stage A~G최종인수는남는다.
