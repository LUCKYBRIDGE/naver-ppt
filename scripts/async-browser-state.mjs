// Async predicates must be awaited explicitly. waitForFunction in the bundled
// Playwright version treats the returned Promise as a truthy immediate result.
export async function waitForBrowserState(page, predicate, arg, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await page.evaluate(predicate, arg) === true) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw Error('BROWSER_STATE_TIMEOUT');
}
