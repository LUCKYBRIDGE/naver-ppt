export function extensionApi(): typeof chrome | null {
  const environment = globalThis as typeof globalThis & { whale?: typeof chrome };
  const api = environment.whale ?? environment.chrome;
  return api?.runtime?.id ? api : null;
}
