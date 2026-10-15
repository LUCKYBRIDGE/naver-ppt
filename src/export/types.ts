export type ExportKind = 'session' | 'pdf' | 'pptx';
export type ExportResult =
  | { state: 'complete'; exportId: string; filename: string; transport: 'downloads'; downloadId: number; bytes: number; journal?: 'recorded' | 'unrecorded' }
  | { state: 'complete'; exportId: string; filename: string; transport: 'filesystem'; bytes: number; journal?: 'recorded' | 'unrecorded' }
  | { state: 'failed'; exportId: string; error: string }
  | { state: 'cancelled'; exportId: string };

// complete requires a matching downloads completion or filesystem close + exact readback.
