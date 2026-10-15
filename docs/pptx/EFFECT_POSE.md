# 고급 효과 의미와 완료 모습 복원

2026-10-12 후속: 아래 08:59의 회전 손실은 수정하지 않은 후보의 관측 기록이다. 이후 원본 각도 전달 어댑터에서 합성90도 재생·완료pose 복귀를 검증했다. [최신 근거와 제한](ROTATION_SOURCE.md). 전체 고급 효과/제품 지원 승격은 아니다.

## 샘플과 근거
- X-04/SPIKE-T-04, 2026-10-12 08:59, Windows Whale5.39.412.57 headless profile1791763169461.
- PptxGenJS4.0.1로 생성한 합성2쪽에 DOMParser/XMLSerializer로 timing을 추가했다. 사용자 teacher 원본에는 적용하지 않는다. seed SHA256 `707444f34c5577851f4ae964af285ce4e237c538710c690e206c401b3d4603f5`, 시험 timing 변형 SHA256 `acb079cde9b0856189a85b0753a25210988dbbdceff4326dd13932a8681275b7`.
- XML vocabulary는 [Microsoft AnimateMotion](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.animatemotion?view=openxml-3.0.1), [AnimateRotation](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.animaterotation?view=openxml-3.0.1)의 공통 behavior/시간/shape target 구조를 참고했다. `animRot by=5400000`은90도 시험값으로 지정했다. 각도 단위의 근거는 같은 a:ST_Angle을 제한하는 [Microsoft ST_AngularRadius](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-odrawxml/f66c71b6-d0f2-4f90-947a-ddf8d482b4a9)이다.
- 완전한 OOXML schema validator/실제 PowerPoint 열기·저장 기준은 미실시. 원본 형식의 특정 어휘를 넣은 후보 parser/runtime 경계 시험이며 네이티브 PowerPoint 저장본10종 인수를 대체하지 않는다.

## 관측
- 고정 web-ppt0.4.5 main/Worker에서2쪽·자산1개/70bytes·효과 요약/자산 hash 일치. guard44항목/24XML/타이밍1쪽/내부관계24/잔여override1, 외부0/합성seed 불변 유지.
- 네 클릭은 entrance fade200ms, exit fade200ms, emphasis spin200ms, motion300ms로 읽혔다. 제목은 첫 클릭 후 표시, 둘째 클릭 후 숨김. 이동 경로 `M 0 0 L 0.25 0 E`는 화면960px 폭에서 left36→276(240px)으로 실행됐다.
- **강조 회전은 의미 손실**: 원본 시험값90도에 대해 parser는 spin만 반환하고 angle을 보존하지 않았다. 고정 viewer 소스의 spin은0→360도이므로 종료 computed transform의 각도는0도였다. report.effectFidelity는 `partial: synthetic 90-degree rotation lost`이다. 실행/검증 스크립트 exit0 또는 render pass가 회전 충실도 성공을 뜻하지 않는다.
- **cursor만 복원하면 이동 위치 손실**: 완료4단계 후 A→B→A에서 left가276→36으로 돌아갔다. 상태 cursor와 hidden만 복원한 기존 helper의 한계가 실제로 재현됐다.

## 완료 모습 경계
- `animationSnapshot.ts`: version1, session/document/slide/revision scope와 대상별 opacity/숫자 matrix 또는 matrix3d/단순 inset/visibility만 저장·적용한다. URL/CSS 명령/Infinity·큰 숫자/범위 밖 opacity·중복 또는 잘못된 대상/초과5000개/추가·상속 필드는 거부한다.
- 실제 완료 뒤 후보가 표시한 computed 스타일을 캡처한다. 임의 새 효과 규칙을 만들지 않고 기존 엔진의 **실행 결과**를 복원한다. 후보가90도를 잘못 실행한 결과를 원본90도로 고쳐 주는 기능이 아니다.
- 적용 전 scope/revision 및 모든 DOM 대상을 확인해 누락 대상/늦은 snapshot이 부분 반영되지 않게 한다. 웨일에서는 wrong revision 거부 후 위치도 그대로였다. 단위34개: 직렬화/스타일 한도·비신뢰 값·잘못된 대상/범위·scope4필드/상속·누락 대상 원자성/정상 적용.
- 실제 Whale에서 완료 pose 적용 후 left276 복원, 퇴장 제목 숨김 유지 PASS. 스크린샷에서 이동한 초록 도형과 숨겨진 제목을 직접 확인했다. 초록 도형과 기존 빨강 이미지의 겹침은 합성 scene의 이동 결과다.
- check08:58:22:42파일454tests/TypeScript/Vite/MV3/5스킬 PASS. teacher profile1791763044807의23쪽/12클릭·수명/Worker자산/원본불변 회귀, media profile1791763040942의 정확hash·native무음/pixel·전환/복귀 회귀 유지. 기존 stall Worker 종료·리스너 정리/SVG 공격6개도 유지.

## 남은 일
- 메모리 snapshot만 실험했다. 제품 Player/단일 실행권한·durable DB/백업 계약에는 연결하지 않았다. 끝나지 않은 효과는 capture하지 않는 호출 순서가 필요하며 scope 값 자체가 명령 실행 권한을 주지는 않는다.
- 고정viewport의 완료 모습만 검증했다. transform-origin/레이아웃 변경·다른 DPI, 상대·누적 이동/여러 효과의 합성, 색/필터/비지원 clip-path/반복·autoReverse·중간 재개는 미검증이다. 현재 style 허용표 밖의 모습은 조용히 축소하지 않고 오류로 남긴다.
- 회전 각도 등 원본 behavior 파라미터를 보존하는 parser/runtime 경로 또는 충실한 검증된 대안을 추가해야 한다. 현재 후보를 고급 효과 supported로 승격하지 않는다. 원본 충실도·실물10종 조건과 전체 제품 목표는 유지한다.

## 재현
기존 web-ppt 시험 명령의 teacher 경로 대신 `--effects`와 PptxGenJS 절대경로를 전달한다. 정확 tarball/추출물 cache가 필요하다. 결과/스크린샷은 ignored webppt-spike/effects 안에만 저장한다. 생성 metadata 때문에 seed hash는 실행마다 달라질 수 있으며 한 실행의 main/Worker는 동일 변형 바이트를 받는다.
