# PPTX 확정 레이어와 비공개 편집
- 목표: PPTX의 글상자/판서/가리개 초안과 확정을 기존 strict 델타에 연결하고 Player 원본 효과와 별도 레이어로 표시한다.
- 근거: PRD v5 §6/13/14, FR-008/009/010/013/016. 제품완성 요청의 기존 승인 범위.
- 완료 기준: 확정전Player불변/노트독립,원본비율과normalized좌표,실제폰트측정·overflow,효과·완료pose와레이어분리,자료교차/복구/새Player동일,실제WhaleUI검증.
- 원본색은 실제 원본 픽셀을 읽을 때만 후보로 표시한다. foreignObject Canvas 보안 제한으로 읽지 못하면 원본색이라고 추정하지 않고 수동색 선택/미확인으로 남긴다. 이 제한은 최종 완료를 뜻하지 않는다.

## 영향 범위
- OverlayEditor source view 주입/샘플링경계, RegisteredPptxPreview sizing canvas/독립overlay portal.
- PptxView ShadowRoot 원본runtime와분리된확정overlay portal.
- 단위검증/Whale제품UI draft→commit→효과/교차/백업/복구·재연결·화면크기.

## 단계
1. [x] 원본SVG와별도레이어/sizing canvas/샘플링실패를안전하게표시한다.
2. [x] 기존Editor draft/확정·폰트측정과Player레이어를연결한다.
3. [x] 자동검증/실제WhaleUI검증과기록을갱신한다. (823tests·빌드/Whale1791826916205·foundation1791826934209 PASS, [근거](../pptx/OVERLAYS.md))
4. [ ] 실제원본색픽셀샘플링·원본충실도인수는별도근거로완료한다.
