export const COLOR_TOKENS = Object.freeze([
  'base-100', 'base-200', 'base-300', 'base-content',
  ...['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error']
    .flatMap(name => [name, `${name}-content`]),
]);
export const METRIC_TOKENS = Object.freeze([
  'radius-box', 'radius-field', 'radius-selector', 'size-field',
  'size-selector', 'border', 'depth', 'noise',
]);

// Raw CSS colours deliberately remain framework-neutral (including OKLCH).
// Each adapter is responsible for converting colours required by its framework.
export function readTheme(element) {
  const style = getComputedStyle(element);
  const read = name => style.getPropertyValue(`--${name}`).trim();
  return {
    version: 1,
    colors: Object.fromEntries(COLOR_TOKENS.map(name => [name, read(`color-${name}`)])),
    metrics: Object.fromEntries(METRIC_TOKENS.map(name => [name, read(name)])),
    colorScheme: style.colorScheme,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
  };
}

// Observe theme-bearing ancestors only, never the application's DOM subtree.
// Returns an idempotent disposer. The explicit event also supports theme editors.
export function subscribeTheme(element, listener) {
  let previous;
  let frame;
  let disposed = false;
  const emit = () => {
    if (disposed) return;
    const snapshot = readTheme(element);
    const signature = JSON.stringify(snapshot);
    if (signature !== previous) {
      previous = signature;
      listener(snapshot);
    }
  };
  const schedule = () => {
    if (!disposed && frame == null) frame = requestAnimationFrame(() => {
      frame = undefined;
      emit();
    });
  };
  const observer = new MutationObserver(schedule);
  for (let node = element; node; node = node.parentElement) {
    observer.observe(node, {attributes: true, attributeFilter: ['class', 'style', 'data-theme']});
  }
  const media = matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', schedule);
  window.addEventListener('bonfire:theme-changed', schedule);
  emit();
  return () => {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    if (frame != null) cancelAnimationFrame(frame);
    media.removeEventListener('change', schedule);
    window.removeEventListener('bonfire:theme-changed', schedule);
  };
}
