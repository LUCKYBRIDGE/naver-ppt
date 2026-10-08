/** 0..1 슬라이드 정규화 좌표. 범위 검증은 가져오기·편집 경계에서 구현한다. */
export interface NormalizedRect { x: number; y: number; width: number; height: number }
export interface Point { x: number; y: number }

interface OverlayBase { id: string; zIndex: number; visible: boolean }

export interface TextBoxOverlay extends OverlayBase {
  kind: 'textbox';
  rect: NormalizedRect;
  text: string;
  backgroundColor: string;
  color: string;
  fontFamily: string;
  minFontPx: number;
  maxFontPx: number;
  // fontPx/paddingPx는 기준 viewport의 논리 px. 표시 배율과 구분한다.
  fitMode: 'auto-max' | 'manual';
  fontPx?: number;
  paddingPx: number;
  lineHeight: number;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
}

export interface DrawingStroke extends OverlayBase {
  kind: 'stroke'; points: Point[]; color: string; widthNormalized: number;
  tool: 'pen' | 'highlighter';
}

export interface MaskOverlay extends OverlayBase {
  kind: 'mask'; rect: NormalizedRect; color: string;
}

export type OverlayData = TextBoxOverlay | DrawingStroke | MaskOverlay;
