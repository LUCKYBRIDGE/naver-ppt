import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/base.css';

export function mount(app: ReactNode): void {
  const element = document.getElementById('root');
  if (!element) throw new Error('앱의 root 요소가 없습니다.');
  createRoot(element).render(<StrictMode>{app}</StrictMode>);
}
