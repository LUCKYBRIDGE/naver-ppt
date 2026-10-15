# PPTX 원본 미디어 설정 연결

2026-10-13 09:12. PRD §11/24/25, FR-005/013/014. 원본 트리거 실행과 별개로 명시적 구간·음량·음소거를 새 내장 미디어 등록에 연결했다.

## 계약과 제품 동작

`sourceMediaSettings.ts`는 기존 strict `bindPptxMediaTimingTargets`의 원본 shape/model path·관계·자산 bytes/hash 대응을 재사용한다. 해당 audio/video cMediaNode의 vol/mute 및 같은 pic의 p14 trim만 읽는다. [Microsoft CommonMediaNode](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.commonmedianode?view=openxml-3.0.1)의 음량/음소거·여러쪽·정지시표시 구분과 [MediaTrim](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.office2010.powerpoint.mediatrim?view=openxml-3.0.1)의 시작/끝에서 제거할 길이를 근거로 한다. trim end를 종료 시각으로 해석하지 않는다.

명시적 vol은 0..100000을 0..1로, trim은 ms를 초로 바꾼다. native metadata 길이를 확인한 뒤 start=st/1000, end=duration-end/1000으로 계산하며 빈 구간·범위 초과·NaN/무한/음수·중복trim·잘못된 대상/속성은 거부한다. 생략된 vol/mute는 null로 보존한다. 원본 기본값이 확인됐다고 주장하지 않고 제품 수동 재생 기본값(음량1/음소거false)을 적용한다는 제한을 알린다.

Editor의 내장 연결 UI가 준비 결과를 `connectPreparedPptxMedia.initialPlayback`에 전달한다. 모든 native metadata와 새 등록 설정을 첫 ADD_LOCAL_MEDIA 이전에 확인한다. 기존 LocalMediaRef.playback 계약만 사용하며 Player/Remote/백업이 같은 값을 사용한다. 재연결은 교사의 기존 playback/bookmark를 유지하고 원본 설정으로 덮어쓰지 않는다. 복사본 원본bytes나 원문명령 저장, 새 권한/의존성은 없다. Editor의 설정 준비는 추가 bounded 원본검사이며 초기 전체 원본 캐시는 만들지 않는다.

numSld>1, showWhenStopped=false, 알 수 없는 미디어 설정은 제한으로 고지한다. 현재 자료 전환 정지 원칙을 유지하며 여러 슬라이드에 걸친 재생을 활성화하지 않는다. 원본 cTn 시작·반복·조건·음원 효과는 이 연결이 실행하지 않는다. 미디어 타이밍/명령의 자동 실행과 concurrent/seek는 계속 미완료다.

## 검증

- 신규15개, 전체80파일 **1,131tests**, 타입/빌드/MV3/5스킬 PASS. 최종 check09:09:32 시작, exit0. 초기 테스트 fixture는 getter attributes에 값을 쓰는 오류를 실제 removeAttribute 패턴으로 수정했다.
- 실제 Whale5.39.412.57 headless `node_modules/.cache/whale-pptx-embedded-media/1791850286198/result.json` exit0. 생성 PPTX를 실제 Editor에서 연결→strict DB→native Player로 전달했다. 영상2.134767초에 st100.25ms/end200.5ms를 적용해 0.10025..1.934267초, 음량.25/muted=true로 확인했다. Remote 재생은 해당 구간 끝에서 정지했다. 교사 변경 음량.6은 재연결/로컬 bundle 복구 후 보존했다. 음원은0..4초/.25/muted=true였다.
- 같은 실행에서 기존 내장미디어/worker재시작·교차/새Player·영상효과/crop/백업·Editor 5viewport 회귀, 새 설정 제한 문구DOM/380px 가로넘침 없음 PASS. source-settings-controls-380.png 직접 확인(연결 버튼/기존 안내 영역). 소리·실제PowerPoint 충실도는 검증하지 않았다.
- 교사PPTX 제품 회귀 `node_modules/.cache/whale-pptx-player/1791850170029/result.json` exit0: 23쪽/12클릭·Remote취소/실패재시도/worker재시작·독립편집/overlay·교차/새Player/로컬백업/5viewport PASS. 교사원본에는 내장미디어0이라 새 설정 기능의 근거는 합성자료다.
- 첫 실제 UI 시험은 문서 선택 누락으로 disabled slide 선택 timeout, 다음은 ACTIVATE_DOCUMENT에 slideId를 넣은 잘못된 시험 사전조건으로 실패했다. 실제 reducer의 null 활성화→GOTO_SLIDE 계약을 확인해 시험을 고쳤으며 최종 실행은 전체 PASS다. 종료한 시험의 profile을 보존했다.

원본hash c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9 불변, 외부요청0/pageerror0. 커밋/배포 없음. Stage A~G와 전체 최종 인수는 열린 상태다.
