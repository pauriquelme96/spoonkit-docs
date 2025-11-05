export function debounce(ms: number, fn: () => void) {
  const clear = setTimeout(fn, ms);
  return () => clearTimeout(clear);
}
