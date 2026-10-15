# 원본 확대·축소 파라미터 전달

## 근거와 구현
- PRD v5 §7.2/8.3/22.4/24 Stage D, X-04/SPIKE-T-04 및 FR-004 완료 복귀 후속이다. 제품 PPTX 지원 승격이 아니다.
- [Microsoft AnimateScale](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.animatescale?view=openxml-3.0.1)의 x150000/y150000 예제와 [ByPosition](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.byposition?view=openxml-3.0.1)의 퍼센트 표현을 읽었다. 고정 office-core0.24.0 소스의 emphasis growShrink는 preset6/by150000→scalePercent150으로 모델링한다.
- [Office 구현 노트](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oi29500/358c6de3-2cd7-459b-8eb9-b90f3721fd12)는 ScaleX/ScaleY 속성명, by-only 시작1과 to-only 시작0, to를 지정하면by무시를 명시한다. 단순히 모든 경우 시작1로 놓지 않았다. zoomContents는 PowerPoint 미지원 속성이므로 이번 경계에서 존재하면 거부한다.
- `scaleBehavior.ts`: by-only/from-to/to-only 값을 축별로 보존한다. 정수 천분의1퍼센트와 명시적 퍼센트를 엄격히 파싱하고 0..1000배 정책 한도를 적용한다. from+by의 실제 끝점/누적 조합은 기준 검증 전 거부한다. 음수/3D/기존 비기본 행렬도 조용히 축소하지 않는다.
- `transformBehavior.ts`: 회전과 확대가 공통으로 사용하는 namespace·조건·step 대응·새 WAAPI KeyframeEffect 적용/실패 정리 경계를 추출했다. `rotationBehavior` API/오류 코드는 유지한다. element.animate/prototype 교체나 자체 클릭/재생 엔진을 추가하지 않는다.
- XML은4MB, 효과5000개 한도. 대상·효과·순서·시간·trigger를 대조하고 반복/역재생/고급 조건·복합 behavior를 거부한다. 원본 파라미터를 **기존 엔진이 생성한 새 native 효과의 키프레임**으로만 전달한다. 원본 파일을 수정하지 않는다.
- scale unit43개, 회전의 signed angle 상한1개 추가. 최종 check 2026-10-12 09:27:08:44파일546tests·TypeScript/Vite/MV3/5스킬 PASS.

## 실제 Whale 결과
- Windows Whale5.39.412.57 headless, 전용 MV3/같은 CSP/로컬 고정 web-ppt0.4.5. 최종 effects profile1791764834867, 합성 seed SHA256 `96aece5b790fa8cc00bd3a3eb3db90be713aa83fff7186373289be7899369604`, 시험 변형 SHA256 `29f88b94114f4701289536b881d73b8c181c59743b7663b37546fec3fe854c61`.
- 합성2쪽에 기존4효과와 image target5의 강조 preset6/animScale by(x150000,y50000)를 추가했다. ScaleX/ScaleY를 명시했다. 사용자 교사 원본에는 추가하지 않았다. 완전한 schema validator/실제 PowerPoint 생성·roundtrip은 미실시다.
- **후보 단독의 의미 손실**: preset6을zoom으로 반환하지만 강조zoom에는 배율 프레임이 없어 opacity1→0.35만 실행한다. 완료 배율x1/y1. 사전 예상한 고정1.25배가 아니라 이 동작이 실제 관측이다.
- **어댑터**: 완료x1.5/y0.5, opacity1 유지. bbox144×144→216×72이며 중심360/252 유지. A→B→A의 완료pose 복원도x1.5/y0.5·opacity1. 이동36→276·퇴장숨김·회전90도/복귀90도·stale pose 거부 유지. 스크린샷의 가로로 넓고 세로로 줄어든 빨간 이미지와 회전 한글을 직접 확인했다.
- 5변형 uniform1.5, shrink0.5(퍼센트 표현), from0.5/2→to2/0.25, to-only0/0→1.5/0.5, by가 있으나from/to우선 사례: 시작/끝 키프레임과 완료값 PASS. 100ms의 native computed progress로 중간x/y 행렬 오차<0.001 검증. 단순 완료행렬만 확인한 것이 아니다.
- 거부8종 negative/중복point/y누락/다른속성명/반복/역재생/zoomContents/from+by PASS. 기존 회전 4변형·조건10종 거부·baseline 보존 회귀도 통과했다.
- main/Worker 모델·전체자산1개70bytes 일치. guard44항목/24XML/내부관계24/잔여override1, 외부0·원본seed불변/기존SVG 공격6개 거부·Worker 시간초과/취소/손상입력 정리 PASS.
- teacher profile1791764753191: 첨부 원본 SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9`, 23쪽·12클릭·busy/전환취소/기본복귀·Worker자산81 대조 PASS. 원본에 회전/확대가 없어 실제 교사 고급효과 증거로 쓰지 않는다.
- media profile1791764764486: 기존 합성 canonical WAV/MP4의 정확hash·무음 native 진행·영상pixel·자료전환pause/수동복귀 PASS. 두 회귀 외부0·원본불변 유지.

## 남은 일
- 격리 후보에만 연결했다. 제품 Session/Player/권한/revision/DB 및 전체 slide part 순서 연결은 아직 없다. 새로운 제품 의존성/권한/지원 버튼을 추가하지 않았다.
- 반복·autoReverse·from+by·누적/그룹 변환·실제PowerPoint 기준·원본폰트/미디어 위치/교사10종·물리DPI 인수는 미완료. 전체Behavioral Fidelity 성공으로 확대해 해석하지 않는다. PPTX unverified 유지.
- 다음은 실제 Office 의미에 따른 반복/역재생·시간조건 전달과 후보 역량 보고를 연결하는 일이다. 모호한 조건은 계속 별도 거부/고지한다.
