# 원본 회전 파라미터 전달

2026-10-12 09:27 후속: 조건/step대응/새native 키프레임 적용을 `transformBehavior.ts`로 추출하고 회전API는 유지했다. 기존 회전/완료pose·중간행렬·거부/교사 회귀 PASS. 합성시험은 확대를 포함한5효과로 확장했다. [확대 근거](SCALE_SOURCE.md).

## 구현과 경계
- PRD v5 §7.2/8.3/22.4/24 Stage D, X-04/SPIKE-T-04 및 FR-004의 완료 모습 복귀 후속이다. 제품 PPTX 지원 승격이나 자체 타임라인 엔진 구현이 아니다.
- `rotationBehavior.ts`는 원본 슬라이드 XML의 `animRot by/from/to`를 읽어 기존 후보 step과 대상·효과·순서·duration·delay·trigger를 대조한다. DOMParser/namespace·4MB·효과5000개 한도와 명시한 어휘를 적용한다. 잘못된 값, 대응 누락/모호함은 `PPTX_ROTATION_UNVERIFIED`로 거부한다.
- 각도 단위는 1/60000도, 음수는 반시계 방향이며 여러 바퀴 값을 정규화하지 않는다. [Microsoft AnimateRotation의 원본 정의](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.animaterotation?view=openxml-3.0.1)를 근거로 한다.
- 검증된 기존 web-ppt `playGroup`이 만든 **새 대상 WAAPI KeyframeEffect**에 `setKeyframes`를 동기 호출한다. 엔진의 그룹·duration·delay·easing·취소 수명은 유지한다. 전역/prototype/element.animate를 덮어쓰지 않는다. 프레임 교체 실패 시 이번 실행의 새 native 애니메이션만 취소한다.
- by만 있으면 현재 계산된 2D 행렬을 보존하고 상대 회전을 연결한다. from/to 및 from+by는 기본 행렬에서 명시된 시작/끝 값을 사용한다. by+to의 모호한 조합, 비기본 변환의 절대 끝점, 동시 같은 대상, 3D 변환은 거부한다.
- fill hold·main click/with/after의 단일 회전만 실험했다. 반복·역재생·가속/감속·속도·interactive sequence·끝 조건·복합 behavior·문단 대상은 지원으로 처리하지 않는다. 원본 XML/파일은 수정하지 않는다.
- 단위 48개: 각도 단위/부호/범위·다중 회전/끝점/행렬·오류와 적용 대상·엔진 수명·실패 정리. 실제 XML 경계와 네이티브 동작은 아래 Whale 시험에서 추가 검증했다.

## 실제 Whale 근거
- 최종 효과 profile1791764147937, seed SHA256 `016b091a02d373e8f5fdb27634f7a6d125814e0e12af21a00d89133aaa301612`, 시험 변형 SHA256 `d648fc696accc7a8ded8f71a599471bf4de6183b31599f0fc875ca7f8d3b9917`. 2026-10-12 09:16:00 check: 43파일502tests/TypeScript/Vite/MV3/5스킬 PASS. 최종 effect failure null/외부0/원본seed 불변, main/Worker 요약·자산 대조 유지.
- Windows Whale 5.39.412.57 headless, 전용 MV3/같은 CSP/로컬 bundle. 기존 fixture에 `--effects`와 bundled PptxGenJS 경로를 전달한다. 합성 XML이며 실제 PowerPoint 생성·roundtrip 인수를 대체하지 않는다.
- 합성 90도: 수정하지 않은 후보 완료0도와 어댑터 완료90도를 **같은 실행에서 비교**한다. 자료 A→B→A의 완료 pose 복원도90도. 도형 중심 유지·회전 뒤 화면 안 bbox와 스크린샷의 세로 회전 한글을 직접 확인했다.
- -90도, from45→to-45도, from45+by90→135도, by720도의 키프레임과 완료값 PASS. 각 경우 100ms 시점의 native computed progress와 계산된 회전 행렬 오차 <0.001. 720도는 최종0도만으로 판정하지 않고 원본 720 키프레임/중간 프레임도 검사했다.
- 상대 by90도 전에 행렬 회전90도/이동20·30을 설정하면 완료180도, 이동20·30 유지 PASS. 이것은 합성 CSS baseline 시험이며 모든 authored 그룹/누적 의미 검증이 아니다.
- 반복·역재생·상위 반복·손상 각도·모호한 값·대상 불일치·시간 불일치·복합 효과·다른 속성명·behavior 시작 조건 10종 거부 PASS. 기존 이동36→276/완료pose복원·퇴장숨김·stale revision 거부 유지.
- 회전 타깃의 기존 합성8인치 상자는 중심 회전 시 글자가 화면 밖으로 나갔다. 중심 유지 자체는 정상으로 확인했다. 관찰 가능한 fixture를 위해 **생성된 합성 상자만** 3인치 폭/x8인치로 배치했다. 사용자 파일/일반 renderer의 위치를 고친 것이 아니다.
- teacher profile1791763876332: 첨부 원본 SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9`, 23쪽·12클릭·busy/전환 취소/복귀·Worker 자산81개 대조 PASS. 이 자료에 회전은 없으므로 실제 교사 회전 충실도 증거로 쓰지 않는다.
- media profile1791763886969: 합성 canonical WAV/MP4의 기존 정확hash·muted 진행·영상pixel·자료전환 정지/수동대기복귀 PASS. 두 회귀의 외부 요청0/원본불변 유지.

## 제한과 다음 단계
- 격리 시험의 slide1에서 A/B 독립 모델별로 원본 회전을 바인딩했다. 제품 Session/Player/DB·전체 슬라이드 part 순서 계약에는 아직 연결하지 않았다. 제품에는 PPTX 지원 버튼을 활성화하지 않았다.
- 원본 PowerPoint 기준과 실제 회전/확대/복합 효과 파일, 반복·역재생·트리거, 모든 layout/DPI·글꼴·미디어 위치는 미검증이다. 본 시험은 원본 각도 전달 경로의 증거이며 전체 Behavioral Fidelity 성공이 아니다.
- 다음은 animScale/색·반복 파라미터 보존 경로 비교와 제품 어댑터 연결 조건이다. PPTX 지원 수준은 unverified로 유지한다.
