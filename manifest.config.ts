export const manifest = {
  manifest_version: 3,
  name: 'Whale Class Presenter',
  version: '0.0.0',
  description: '웨일 클래스 프레젠터 개발 기반. 발표 기능은 단계별 구현 예정입니다.',
  action: {
    default_title: '웨일 클래스 프레젠터',
    default_popup: 'launcher/index.html',
  },
  background: { service_worker: 'background.js', type: 'module' },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
} satisfies chrome.runtime.ManifestV3;
