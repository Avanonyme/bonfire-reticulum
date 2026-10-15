import {readTheme, subscribeTheme} from './theme.js';

// mount() may return a handle or a Promise of one. Handles expose destroy(),
// and optionally updateTheme(snapshot), disconnected(), reconnected().
export function createEmbeddedAppHook(adapters) {
  return {
    mounted() {
      this.embeddedDisposed = false;
      this.embeddedController = new AbortController();
      this.embeddedHandle = null;
      this.embeddedConnected = true;
      const mount = this.el.querySelector('[data-embedded-mount]');
      const status = this.el.querySelector('[data-embedded-status]');
      this.embeddedStatus = status;
      const setStatus = message => {
        if (this.embeddedDisposed || !status) return;
        status.textContent = message;
        status.hidden = !message;
      };
      const adapter = adapters[this.el.dataset.embeddedApp];
      if (!mount || !adapter) {
        setStatus('Embedded app adapter is not installed.');
        return;
      }
      this.embeddedTheme = readTheme(this.el);
      const report = error => {
        console.error('Embedded app integration:', error);
        setStatus('Embedded app could not start.');
      };
      this.embeddedUnsubscribe = subscribeTheme(this.el, theme => {
        this.embeddedTheme = theme;
        if (this.embeddedHandle?.updateTheme) {
          Promise.resolve().then(() => {
            if (!this.embeddedDisposed) return this.embeddedHandle.updateTheme(theme);
          }).catch(report);
        }
      });
      Promise.resolve().then(() => {
        if (this.embeddedDisposed) return null;
        return adapter.mount({
          element: mount,
          theme: this.embeddedTheme,
          signal: this.embeddedController.signal,
          setStatus,
        });
      }).then(handle => {
        if (!handle) return;
        if (this.embeddedDisposed) return handle.destroy?.();
        if (typeof handle.destroy !== 'function') {
          throw new Error('Adapter must return a destroy() handle');
        }
        this.embeddedHandle = handle;
        handle.updateTheme?.(this.embeddedTheme);
        if (!this.embeddedConnected) handle.disconnected?.();
        setStatus('');
      }).catch(report);
    },
    disconnected() {
      this.embeddedConnected = false;
      this.embeddedHandle?.disconnected?.();
    },
    reconnected() {
      this.embeddedConnected = true;
      this.embeddedHandle?.reconnected?.();
    },
    destroyed() {
      this.embeddedDisposed = true;
      this.embeddedController?.abort();
      this.embeddedUnsubscribe?.();
      const handle = this.embeddedHandle;
      this.embeddedHandle = null;
      Promise.resolve().then(() => handle?.destroy()).catch(console.error);
    },
  };
}
