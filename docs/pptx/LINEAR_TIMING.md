# 기본 시간곡선 전달
- 2026-10-12 21:34, PRD v5 Stage D / X-04 / SPIKE-T-04 / FR-004.
- `transformBehavior.ts`는 가속·감속이 없거나 명시적 `0`/`0%`인 회전·확대만 허용한다. 모든 조상 cTn을 검사하며 비영/잘못된 값, speed/필터 등 기존 미검증 조건은 거부한다.
- 해당 source에 대응하는 새 소유 WAAPI의 easing만 `linear`로 바꾼다. 기존 엔진의 지연/기간/그룹/수명과 반복 전달을 유지한다. 기존 애니메이션과 이동/fade 등 다른 효과의 곡선은 바꾸지 않는다. timing API 부재/실패는 새 run 취소로 처리한다.

## 증거
- check21:32:55: 45파일583tests, TypeScript/Vite/MV3/프로젝트5스킬 PASS. native timing 부재/실패 정리 단위2개 추가.
- 실제 Whale5.39.412.57 headless effects1791808436215: 기존 반복6조건에서 50/100/250/300ms의 progress를 원본 선형 시간 기준0.25/0.5 및 역방향0.75/0.5와 독립 비교 PASS. 각 progress의 회전/확대 native 행렬 비교도 유지한다.
- 2.5회 반복의 완료 progress0.5와 45도 행렬(a/b=sqrt(0.5)), 완료pose 복귀 PASS. 명시적0/0% 허용 및 behavior/effect/ancestor의 비영·잘못된 accel/decel/spd/tmFilter9조건 거부 PASS.
- 기존 회전/확대 끝점·afterPrev/취소/pose/Worker/SVG 회귀 PASS. 완료복귀 화면 직접 확인.
- teacher1791808446315: 첨부23쪽/12클릭/수명 회귀 PASS, SHA256 `c140d32f4f13160c26dbd994706ec49cdf23d66d78c03204de935b39da052ec9` 불변. media1791808456513: WAV/MP4 hash·무음 재생·pixel·전환/복귀 PASS. 모든 시험 외부요청0.

## 제한
- 실제 PowerPoint 재생/원본 pixel 비교가 아니라 스키마 기본 조건과 native 선형 시간에 대한 합성 시험이다. 비영 가속·감속, 상위 복합 시간곡선, 다른 효과의 원본 시간 전달은 미완료다.
- 제품 Player/DB·역량 고지 연결 및 물리 교실 시험은 미완료다. PPTX unverified를 유지한다. 이전 REPEAT_TIMING의 고정 cubic 곡선·분수 progress 미검증은 이 범위에 한해 해소했다.

## 근거
- [Microsoft CommonTimeNode](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.presentation.commontimenode?view=openxml-3.0.1)의 accel/decel 시간 비율 정의.
- [python-pptx 공식 소스의 timing 스키마](https://github.com/scanny/python-pptx/blob/master/docs/dev/analysis/shp-movie.rst): 기본 accel/decel0%, speed100%. 원본 기본 조건에서 linear를 적용하는 것은 이 근거에 따른 구현 판단이며 실물 재생 비교는 별도다.
