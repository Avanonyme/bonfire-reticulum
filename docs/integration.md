# Bonfire integration starter

This is an uncompiled, untested starter, not a packaged MeshChat application.
The existing README is preserved. No identity, node, native process, contact
sync, federation, or ACL replication is implemented.

## Host registration

Add this repository as the `:bonfire_reticulum` dependency using the host
flavour's dependency mechanism. Resolve dependency versions through the host
lockfile. The minimal mix.exs does not copy Bonfire's Mess/umbrella setup.
Verify it in your target checkout before adopting it for release builds.

Register `Bonfire.Reticulum.Web.Routes` through the host's extension router
mechanism (or `use Bonfire.Reticulum.Web.Routes` inside its router). Register
this static route BEFORE existing `/messages/:id` routes. Do not register it
twice. Browser and user_required pipelines are required. Verify the host's
LiveView authentication on websocket reconnect as well as initial HTTP load.

The page uses the existing messages page identity; no sidebar declaration or
Messages tab has been added without inspecting the target flavour's layout.

## Frontend

Import `createEmbeddedAppHook` from `assets/js/embedded/hook.js` using the
actual dependency-relative path in the host asset entrypoint. Merge this
entry into the hook registry passed to LiveSocket:

```js
EmbeddedApp: createEmbeddedAppHook({meshchat: meshchatAdapter})
```

`meshchatAdapter` must be supplied by the subsequent MeshChat frontend patch.
Register an empty object initially to see the explicit missing-adapter state.
No arbitrary module URL, native command, or local backend URL is accepted
from server-rendered data attributes.

An adapter implements:

```js
const adapter = {
  async mount({element, theme, signal, setStatus}) {
    // Mount your framework into element. Honour signal during async startup.
    // Translate theme.colors into framework-specific values here.
    return {
      updateTheme(snapshot) {},
      disconnected() {},
      reconnected() {},
      destroy() { /* unmount; close sockets; remove listeners */ },
    };
  },
};
```

`destroy` is required; other callbacks are optional. Cleanup must be safe
once, including when async startup completes after navigation. Disconnection
does not unmount a running local app. The ignored child container is owned
by the adapter; the outer hook is owned by LiveView.

## Theme contract

Snapshots have version=1, colors (20 raw CSS colour values), metrics,
colorScheme, fontFamily and fontSize. The generic bridge is independent of
MeshChat and Vuetify. It preserves OKLCH instead of assuming hex. Empty
values indicate unsupported/missing host tokens and must be handled by the
adapter. Subscribe after Bonfire CSS loads.

Changes to class/style/data-theme on the hook or its ancestors and system
colour preference changes trigger a deduplicated snapshot. For stylesheet
replacement, theme-editor operations, or other changes outside those
signals, dispatch `window.dispatchEvent(new Event('bonfire:theme-changed'))`
after applying the theme. This does not claim to detect every CSSOM change.

## Boundaries and next steps

The route gates the Bonfire page; it does not grant permissions inside
MeshChat. The adapter must not expose native process/file privileges to
untrusted pages. Backend origin selection, credentials, websocket routing,
CSP, microphone permissions and native packaging remain explicit follow-up
work. This code does not proxy remote HTTPS traffic to localhost or assume
that browsers allow that connection.

Before release: compile in Bonfire; test guest rejection and reconnect;
verify static-route precedence; test mount/unmount, navigation during async
startup, reconnect, theme modes and custom themes; wire real MeshChat;
verify calls, overlays and local-backend isolation.
