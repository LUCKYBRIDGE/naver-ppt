# 외부 호환 참조와 함께 있는 내장 음원 연결
- 목표: teacher-02의 외부 audio 호환 참조에 접근하지 않고 같은 도형의 p14 내장 관계를 검증해 제품 Player 음원으로 연결한다.
- 승인: 제품 완성 지속 개발과 인수인계의 내장 MP3 연결 후속 작업.
- 완료 기준: 외부 대상 무접근·내부 part/header/도형 ID/관계 kind 일치, 모호/충돌/변조 거부, 소유 Blob 수명·원본 불변, 실제 Whale에서 제품 미디어 등록/native 수동 재생·PDF 교차 위치·해제, 관련 회귀/check와 인수인계.
- 영향: sourceModel/assetModel의 누락 media src 보완, mediaTimingBinding의 같은 관계 선택 규칙, 신규 helper와 단위·실물 검증.
- 위험: 내장 Blob 메모리 추가/중복 참조, 외부와 내장 내용의 차이, 잘못된 도형 연결. 원본의 내장 사본만 선택하며 원본 앱 동일 음원/효과/교차쪽 동작 전체를 보장하지 않는다.

## 단계
1. [x] 관계 선택 helper: primary Internal은 p14와 일치해야 하고 primary External은 유효한 내부 p14가 있을 때만 로컬 선택. 외부 Target은 읽거나 실행하지 않는다.
2. [x] 누락된 모델 media만 원본 순서/고유 shape ID에 대응하여 보완. 실제 등록된 자산 소유자에 추가하고 part별로 재사용/해제한다. 해석 불가한 요소는 기존 미지원으로 남긴다.
3. [x] 타이밍 binder도 같은 helper 뒤 기존 bytes/hash 검증 유지. 모델 보완은 source 자동재생 권한이 아니다.
4. [x] 단위/check·실제 teacher-02·합성/teacher-01/PDF 회귀.1,272tests/빌드·대용량1791906468561/교사1791906537732/내장1791906691069/foundation1791906537862 PASS. 소리/원본타이밍·새원본의교차쪽재생복원전체는후속.
5. [x] 검증/호환성/계약/인수인계 갱신. 전체 제품과 Stage D 최종 선정은 미완료 유지.

## 실제 실험 후 범위 보완
- 1791905746809에서는 내장 연결/native metadata·Player준비/자산해제가 성공했으나 browserWorkingSet표본1,917,026,304bytes로실험1.5GiB기준을넘었다. 성공으로세지않고기록을보존한다.
- 동일창/동일불변File의준비완료모델을참조수명으로공유해미리보기·연결중복파싱을줄인다. WeakMap은마지막사용자dispose후원본·Blob소유를보존하지않는다. 첫동시미완료job공유/창간globalbudget은이번변경대상이아니다. 취소·서로다른File·마지막해제/재파싱을테스트한다.
- 소유input을parser에transfer하고32MiB초과media는원본size/hash근거를캡처한뒤중복rawbuffer를해제했다. 등록Blob/파일hash대조는계속유지한다. 최종제품경로표본WorkingSet1,568,329,728bytes(약1.46GiB),1.5GiB실험기준이내. 이전초과/경합실패는TEST_RESULTS에보존했다.
