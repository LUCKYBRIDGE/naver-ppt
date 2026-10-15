2026-10-15: `OPEN_SOURCE_MAX_COUNT`/`OPEN_SOURCE_MAX_BYTES`로 SourceVault 창별 참조 한도를 명시하고 합계·개수 초과/기존 원본 보존을 단위검증했다. 이는 FR-003/013 및 PRD v5 §11/16의 원본 보존·복수 자료 경계 근거이며 전체 브라우저 메모리 예산이나 PPTX 충실도 완료 근거가 아니다. [근거](TEST_RESULTS.md)
# 요구사항 추적

2026-10-14 PRDv5 §11/16/24/28/30·IMPL-T-28: 검증된sourceURL과nativeborrowlease로추가URL/중복수명관리를제거했다.1,412tests/빌드·actualnative동일DOM/reprepare/최종해제PASS. 단일WorkingSetFAIL·origin전체byte예산/실물10종/원본앱/물리/나머지Stage인수는미완료다. [근거](pptx/BORROWED_MEDIA_URL.md).

2026-10-14 PRDv5 §6/11/14/16/24/28/30·FR-004/008·IMPL-T-28:재연결대기취소/late결과·현재source/새연결보호를1,403tests/빌드·actualWhale UI/nativequeue/제품회귀로검증했다. byte예산/성능·실물10종/원본앱/물리/전체Stage인수는남는다. [근거](pptx/SOURCE_CANCELLATION.md).

2026-10-14 PRDv5 §6/11/16/24/28/30·FR-003/008·IMPL-T-28: origin-wide PPTX준비입장·queued/active취소/실패·ready/원본/현재발표보존을1,395tests/빌드·actualWhale2popup/제품회귀로검증했다. 단일대용량WorkingSetFAIL·SourceVault대기취소·누적byte예산/물리/실물10종/원본앱/전체Stage인수는미완료다. [근거](pptx/PREPARATION_ADMISSION.md).

2026-10-14 PRDv5 §11/16/24/28/30·FR-003/008·IMPL-T-28:private scratch소비/원본·Blob/alias·소유권보존과1,387tests/빌드·실제Whale기능회귀를검증했다. backing storage 감소와전체WorkingSet기준FAIL을분리하며전역admission/다중자료·성능/실물10종/원본앱/물리/전체Stage 인수는미완료다. [증거](pptx/PRIVATE_BUFFERS.md).

2026-10-14 PRDv5 §7/11/16/24/28/30·FR-003/008·IMPL-T-28: 중복 raw 이미지·작은 미디어의 exact 바이트 대조/근거/해제·최종 owner 정리,1,375tests/빌드·실제Whale 기능 회귀 PASS. 최종 WorkingSet 기준 FAIL로 성능·전역 자원 예산/실물10종/원본앱/물리/전체Stage 인수는 미완료다. [증거](pptx/DUPLICATE_PARTS.md).

2026-10-14 PRDv5 §6/11/16/24/28/30·IMPL-T-28:같은File의동시source job공유·개별취소/전체abort·예약owner/최종해제·늦은결과/실패재시도를연결했다. unit/실제Whale기능PASS. 대용량새표본은기준초과FAIL이므로전역admission/성능·원본앱/실물10종/물리/전체Stage인수는미완료. [증거](pptx/INFLIGHT_SOURCE.md).

2026-10-14 PRDv5 §6/11/16/24/28/30·FR-004/005/008·IMPL-T-28: 선택 자료 수명의 모델과 동일Blob/File identity 재사용으로 실제 중복 파싱/읽기를 제거했다. 1,362tests·빌드/Whale 기능 회귀와 teacher-02 두1.5GiB 실험 기준 PASS. 전역 자원한도·저사양/장시간·실물10종/최종충실도/물리/나머지 Stage는 미완료. [증거](pptx/SOURCE_REUSE_MEMORY.md).

2026-10-14 PRDv5 §6/8/11/16/24/28/30·FR-004/005/008·IMPL-T-28: PPTX 직접 전환/자동 넘김 우회 차단과 기존 검증 경로 이행을 완료했다. 저장/pending 불변·PDF 정상 전환/COMMIT·실제 Whale 회귀/1,356tests·빌드 PASS. **대용량 메모리 기준은 실제 두 실행 FAIL**이므로 성능·계획5/최종 인수는 미완료다. [증거와 다음](pptx/TRANSITION_ADMISSION.md).

2026-10-14 PRDv5 §6/8/11/14/24/28/30·FR-004/005/008·IMPL-T-28: 정상 Remote 요청을 Player 준비 표면에 연결했다. 실패/취소·누락은 기존 화면 유지, 불명확 COMMIT은 저장 상태 조정, 성공은 같은 DOM/native 승격. 실제 Whale·1,351tests/빌드 [근거](pptx/PREPARED_SCENE.md). 직접 전환 입장·대안PDF/대용량·실제10종/물리/최종 인수는 남는다.

2026-10-14 PRDv5 §6/8/11/14/24/30·FR-004/005/008: Player지정전환pending/취소·확정·실패/strict영속화·목표공개투영계약1단계구현.1,344tests/빌드·actualWhale현재화면/무음재생·worker재시작/역할·새owner·backup복구증거는[실행기록](TEST_RESULTS.md). 실제준비표면/Remote소비·직접명령입장/전체안전전환인수는미완료다.

2026-10-14 PRDv5 §8/24/30·FR-004/008·IMPL-T-28: Remote준비검사실패/취소시기존화면유지,명시정상쪽원자활성화/대상경합·최신revision검증을추가했다.1,324tests/빌드·actualWhale근거는[실행기록](TEST_RESULTS.md). 직접명령입장/Playerstaging·대안PDF연결/전체인수는남는다.

2026-10-14 PRDv5 §7/24 Stage D·FR-003/008: 원본bgRef의고정parser 계산오류를수정했다. 실제52쪽/합성10종/원본보존·학생화면독립과1,304tests/빌드근거는[실행기록](TEST_RESULTS.md). 최종Visual/Media/Behavior·실물10종/물리/안전전환UX 인수는남는다.

2026-10-14 PRDv5 §9/10/24 Stage C/D·FR-003/008: 신규PPTX/원본점검에명시슬라이드글꼴local조회실패/미확인·대체위험안내를추가했다. 1,288tests/빌드와actualWhale제품등록·취소/시간초과/학생화면·원본보존근거는[검증기록](TEST_RESULTS.md). 재연결은 미검사안내/원본점검경로를명시한다. 실제적용·상속theme/embedded/glyph/license・Stage C전체/최종충실도인수는남는다.

2026-10-14 FR-003/008·PRDv5 §7/16/24 Stage C/D: 글꼴숫자Preflight와teacher-02전체52쪽제품/PDF비교근거를추가했다. 실제Whale raw720×540·원본불변·학생화면독립/외부0,텍스트51쪽일치·33쪽불일치/픽셀차이는[teacher-02](pptx/TEACHER_02.md)에기록했다. 설치·적용/Visual지원승격과실제10종·물리/전체인수는미완료다.

최상위 기준은 [PRD v5](../naver-ppt_PRD_v5.md)다. 아래 FR ID는 v4 §12의 추적 식별자로 보존하며, v5 §24/30의 단계·의사결정 우선순위가 우선한다. PDF 복사본은 v5 Stage B 완료 조건이다.

| ID | 우선순위 | 요구사항 | 검증 기준 |
|---|---|---|---|
| FR-001 | P0 | 툴바 빠른 실행 | 최근 세트에서 추가 탐색 없이 발표 재진입 |
| FR-002 | P0 | 두 모니터 발표/리모컨 분리 | 모니터 1 조작 중 모니터 2 화면 유지 |
| FR-003 | P0 | 복수 파일 동시 세션 등록 | PDF 2개·PPTX 1개 추가 가능 |
| FR-004 | P0 | 파일별 페이지 기억 | A 5→B 2→A 5 복원 |
| FR-005 | P0 | 포커스 독립 미디어 재생 | 다른 앱 조작 중 지원 영상·음원 지속 |
| FR-006 | P0 | 자동 넘김/일시정지 | 설정 시간 이후 정상 진행, 자료 전환 시 중지 |
| FR-007 | P0 | 독립 리모컨 | 다른 창 클릭에도 팝업 자동 닫힘 없음 |
| FR-008 | P0 | 비공개 미리보기 편집 | B 8 편집 중 A 5 출력 유지 |
| FR-009 | P0 | 우클릭 글상자 | 배경 선택→드래그→입력→화면 적용 |
| FR-010 | P0 | 고정 상자·최대 글씨 맞춤 | 가로/세로 제한, 최소/최대 글자 크기 준수 |
| FR-011 | P0 | 현재 자료 종료 | 현재 자료만 종료, 나머지 유지 |
| FR-012 | P0 | 일괄 종료 | 모든 자료 저장 체크 및 종료 |
| FR-013 | P0 | 원본 보존/복사본 | 내보내도 원본 파일 해시 불변 |
| FR-014 | P0 | 자동 복구/세션 저장 | 브라우저 강제 종료 뒤 변경 내용 복원 |
| FR-015 | P1 | 발표자 노트 및 진행 기록 | 파일·슬라이드별 독립 저장, 청중에게 비노출 |
| FR-016 | P1 | 판서·타이머·보드·가리개 | 자료 전환에도 설정 범위대로 복원 |
| FR-017 | P1 | 폰트 관리 | 내장/사용자 폰트 적용 및 화면 일치 |
| FR-018 | P1 | PDF 수정본 내보내기 | 글상자·판서 반영 PDF 복사본 열기 가능 |
| FR-019 | P1 | 웹 발표 링크 W0 | 두 서비스 링크 실행, 창·세션 관리 |
| FR-020 | P1 | 수업 세트/즐겨찾기 | 여러 파일/링크 및 마지막 페이지 함께 복원 |
| FR-021 | P2 | PPTX 복사본 내보내기 | 안내한 손실 범위에서 외부 앱 열기 가능 |
| FR-022 | P2 | 온라인 발표 W1~W3 | 서비스별 기능 매트릭스 통과 시 활성화 |
| FR-023 | P2 | 구형 PPT/한쇼 직접 지원 | 변환 또는 파서 안전성 검증 후 제공 |

## 구현 연결

2026-10-13 방향 감사: 아래는 실제 구현과 검증된 부분을 분리한 최신 추적이다. 이전의 '계약만/Whale 미검증'은 최신 코드·결과와 불일치하여 정정했다. **전체 제품 및 각 FR의 최종 물리 인수는 미완료**다. 자동 테스트·Whale headless 통과를 물리 교실·충실도 인수로 확대하지 않는다.

| FR | 주요 모듈 | 인수 근거 | 상태 |
|---|---|---|---|
| 001, 007 | launcher, background, remote | X-01, AT-03, IMPL-T-01/11 | 수업/창 재사용·독립 Remote/재연결 구현, Whale foundation 통과. 실제 툴바·보이는 창/최근 세트 UX 인수 남음 |
| 002 | background | X-02, AT-18, IMPL-T-24 | 독립 역할 창 구현. 자동 모니터 배치/듀얼·복제·DPI/HDMI 물리 인수 남음 |
| 003, 004 | core, adapters, player | X-03, AT-01, IMPL-T-02/03 | PDF 교차 위치/실험 PPTX 일반 등록·교차·재연결 Whale headless 통과. PPTX 충실도 인수 남음 |
| 005, 006 | media, player | X-05, AT-02/10, IMPL-T-12~14 | PDF 시간/미디어끝·결합 자동넘김, WAV/MP4·소유권·교차 위치 구현/Whale 통과. PPTX 공통 자동넘김 제외; 혼합 타이밍·다른 코덱·실제 소리·5분 외부 focus 남음 |
| 008 | core, editor, overlays | AT-04, IMPL-T-04/05 | PDF/PPTX 독립 Editor·노트/확정 overlays, 기존 학생화면 불변 Whale 통과. 실제 듀얼 모니터 인수 남음 |
| 009, 010 | overlays, editor, player | X-06, AT-05~09, IMPL-T-06~10 | 우클릭/길게누르기 진입·고정 상자/실측 font fit/overflow 차단·IME 이벤트·draft/commit Whale 통과. 물리 한글 IME/터치, PPTX 원본색 추출 남음 |
| 011, 012 | core, remote, export | AT-11/12/14, IMPL-T-15/16/19 | 현재/전체 비삭제형 종료·취소/저장확인·검정 대기/델타·Editor 초안 유지 구현, foundation 통과. 물리 저장 chooser·여러 Editor/실제 종료 인수 남음 |
| 013, 014 | storage, export | X-07, AT-13~15, IMPL-T-17~20/25/26 | strict DB/저널·PDF/PPTX 백업/원본 재연결·정상 재시작·worker 복원/원본 hash 불변 Whale 통과. 비정상 browser/PC crash·OS 다운로드 인수 남음 |
| 015, 016 | core, media, overlays | AT-01/04, IMPL-T-04/14/18 | 비공개 노트·판서/가리개·countdown/stopwatch/두음 알림·위치 구현/Whale 통과. class log 전용 UI·보드/형광펜·물리 스피커/절전 인수 남음 |
| 017 | overlays | AT-20 | 설치 글꼴의 실제 측정/최대크기 구현. embedded/사용자 폰트 관리·대체 경고·원본 일치 미완료 |
| 018 | export, overlays | IMPL-T-17 | vector PDF 원본+확정 overlay 새 복사본·write/close/readback·회전/crop/한글 검증. OS chooser/downloads/외부 뷰어·실물 인수 남음 |
| 019, 020 | adapters, storage, launcher | X-08/09, AT-16/17, IMPL-T-18/21~23 | PDF/PPTX 수업 JSON 백업/새수업 복구·원본 재연결 Whale 통과. 즐겨찾기·Canva/미리캔버스 W0 미구현 |
| 021~023 | adapters, export | X-04/10, AT-19, IMPL-T-27/28 | PPTX 원본 불변/실험 재생·미지원 회전/확대 등록 경고 구현. PPTX 복사본/PPT/SHOW/W1~W3 경로 및 인수 미완료 |

## PRD v5 전체 범위와 남은 인수

아래 절 번호는 FR의 누락을 막기 위한 v5 추적이다. §1~3/26/28~30의 정의·원칙·의사결정은 모든 행에 적용한다. 상세 결과/환경/명령은 [TEST_RESULTS](TEST_RESULTS.md), 범위별 등급은 [호환성](COMPATIBILITY_MATRIX.md), 단계 완료 게이트는 [전체 계획](plans/2026-10-11-product-completion.md)을 따른다.

| PRD 절 | 현재 근거 | 최종 인수에 남은 것 |
|---|---|---|
| 4~6 구성/진입/세션 | 4역할 창·공통 Import·독립 선택/현재 종료/strict 상태 자동·Whale foundation 및 PPTX 제품 검사 | Windows 외부 파일 전달/모니터 물리 UX |
| 7 형식 전략 | PDF 수직 기능, PPTX 후보 비교 3종+web-ppt·실물2종/기준PDF1종·합성 media/효과. 내장 음원·영상64MiB/teacher-02 내장 관계·제품 MP3 등록/무음 재생 확인 | 교사10종/PowerPoint 기준 Visual·Media·Behavior; teacher-02 실제 소리/원본 자동 타이밍·전체 충실도; PPT/SHOW/Web 경로 |
| 8~10 Preflight/등급/폰트 | PDF 읽기/캐시·PPTX 구조/모델 진단·등록 transform 경고, 라이선스 기록 | 실제 누락폰트/overflow·코덱/고급효과 종합 사전점검·환경 cache/최종 선정 |
| 11~12 미디어/오프라인 | 합성 WAV/MP4·소유Player·worker 재시작/Remote닫힘/교차·검사한 media-only source 그룹 | 5분 다른 앱 focus/실제 소리/여러 코덱·cold 완전차단 시작/등록/편집/저장/복구 |
| 13 빠른 편집 | PDF/PPTX 확정 overlays·실측 font fit·독립 노트, 대역 IME와 Whale 화면 | 물리 IME/터치·원본색 PPTX·교실 UX |
| 14 저장/복구 | strict DB/완료저널·새파일/백업·재검증·정상 재시작 | OS chooser/downloads·비정상 crash·대용량/용량부족 |
| 15 Windows Launcher | 제품 확장 내부 경로 구현 | 인증 IPC/native messaging·우클릭/복수/cold/warm·실패 fallback |
| 16 성능 | lazy adapters·PDF bounded cache·초기 번들 검사 | 대용량 메모리/지연·캐시 상한/성능 예산 실측 |
| 17 보안/개인정보 | MV3 CSP/최소권한·비신뢰 ZIP/XML/SVG·로컬 원본/해시 검사 | 실제 악성 fixture·패키지/NOTICE 최종 감사 |
| 18 주요 흐름 | PDF 등록/교차/비공개 편집/저장·PPTX 실험 경로의 Whale 자동화 | 물리 교실·외부 진입·미지원 효과 안전 대안 UX 인수 |
| 19 중복/파일 변경 | 동일 hash 재사용·다른내용 재연결 거부·등록UUID 유지 자동/Whale 검사 | 실제 파일 이동/변경/OS 권한 인수 |
| 20~21 UX/비목표 | 독립 선택·명시 확정·비삭제형 종료·원본불변/로컬 경계 | 교사 물리 사용성·서비스/레거시 경로 판정; Office 전체 복제 제외 |
| 22~23 테스트/매트릭스 | 자동 1,272tests/실제Whale headless 제한된 회귀 및 기능별 미확인 기록 | 실제10종·물리/장시간·cold offline·고급효과 인수 |
| 24~25 단계/지원승격 | Stage A~G 체크는 미완료 유지 | 실제샘플·정의된기준·Whale·3축·오프라인·성능/메모리·라이선스·제한·테스트문서·매트릭스 10조건별 감사 |

원문: [spec-v4.md](source/spec-v4.md). 구현 및 검증 결과를 변경하면 이 표와 [지원 매트릭스](COMPATIBILITY_MATRIX.md), [검증 결과](TEST_RESULTS.md)를 함께 갱신한다.
