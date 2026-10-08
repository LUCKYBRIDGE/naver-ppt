export type ExportKind = 'session' | 'pdf' | 'pptx';
export type ExportResult =
  | { state: 'complete'; exportId: string; filename: string; downloadId: number }
  | { state: 'failed'; exportId: string; error: string }
  | { state: 'cancelled'; exportId: string };

// complete는 chrome.downloads 완료를 확인한 결과에만 사용한다.
// File System Access 경로는 성공 근거를 별도 discriminator로 추가한다.
