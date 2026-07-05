# Browser Compatibility

## Scope

The project targets the latest stable Google Chrome as the mandatory browser. The additional browser compatibility claim covers latest stable Firefox and Brave on desktop.

This document is based on a static review of the current frontend, backend cookie/session handling, and nginx deployment configuration. It does not replace a final manual check in each browser before evaluation.

Browsers not claimed here:

- Safari
- Opera
- Mobile browsers
- Older ESR/enterprise browser versions

## Summary

| Browser | Status | Notes |
| ------- | ------ | ----- |
| Chrome | Expected compatible | Mandatory target. The app uses modern browser APIs that are supported in current Chrome. |
| Brave | Expected compatible | Brave is Chromium-based, so the Chrome result should generally apply. Brave privacy shields should be left at their default level for evaluation. |
| Firefox | Mostly compatible, with one important risk | Standard APIs used by the app are generally supported in current Firefox, but the game currently calls `navigator.mediaSession` without feature detection. If the target Firefox build does not expose that API, entering a game can fail before the game UI finishes initializing. |

## Findings From The Codebase

### Deployment and HTTPS

The nginx deployment redirects HTTP to HTTPS and serves the application from `https://localhost` using the local certificate in `services/nginx/certs`.

Relevant files:

- `services/nginx/deploy/nginx.conf`
- `services/docker-compose.yml`

Compatibility impact:

- Chrome, Firefox, and Brave should all run the app over local HTTPS once the self-signed certificate warning is accepted.
- Clipboard and secure-cookie behavior depends on using HTTPS. Testing through plain HTTP is not representative of the intended deployment.

### Authentication, Cookies, and Sessions

The backend stores refresh tokens in a secure HTTP-only cookie with `SameSite=Lax` and `path=/api/auth/`. The frontend keeps the access token in memory and sends API requests with `withCredentials: true`.

Relevant files:

- `services/backend/userauth/views.py`
- `services/frontend/src/api/client.ts`
- `services/frontend/src/components/auth/CAuthProvider.tsx`

Compatibility impact:

- This is compatible with Chrome, Firefox, and Brave for same-origin local HTTPS usage.
- Private/incognito windows keep separate cookies and storage. A private tab should not be expected to share the same authenticated state as a normal tab.
- If Brave shields or Firefox privacy settings are made stricter than default, cookie/session behavior should be re-tested.

### Cross-Tab Authentication Sync

The auth provider uses `BroadcastChannel` to share login/logout events across tabs, with a feature-detection guard:

- `services/frontend/src/components/auth/CAuthProvider.tsx`

Compatibility impact:

- `BroadcastChannel` is a widely available browser API in modern browsers.
- If unavailable, the code safely skips the channel. The app can still authenticate in the current tab, but login/logout events will not automatically propagate to other tabs.

### WebSocket Connection

The frontend builds the WebSocket URL from the current page origin:

- `services/frontend/src/constants.ts`
- `services/frontend/src/components/websocket/CWebsocket.tsx`

nginx proxies `/ws/` with the required upgrade headers:

- `services/nginx/deploy/nginx.conf`

Compatibility impact:

- On `https://localhost`, the frontend uses `wss://localhost/ws/global/`.
- Chrome, Firefox, and Brave support WebSockets over HTTPS.
- The WebSocket provider reconnects automatically. That is expected behavior and should not by itself be treated as a browser compatibility issue.

### Audio Playback

The game creates `HTMLAudioElement` instances for track previews and calls `play()` when a round starts:

- `services/frontend/src/handlers/gameHandlers.ts`

The code catches `NotAllowedError` in the main playback path and stores a `songPlayable` state. It also runs an early audio ping to detect autoplay restrictions.

Compatibility impact:

- Chrome, Firefox, and Brave all enforce autoplay rules. Audio may require a user interaction before playback is allowed.
- The app already expects this and can mark audio as not playable.
- Track preview compatibility still depends on the preview URL, format, and CORS behavior returned by the music data source. If the source returns a format a browser cannot decode, the browser will not play it even if the frontend code is correct.

### Media Session API Risk

The game constructor calls `navigator.mediaSession.setActionHandler(...)` directly:

- `services/frontend/src/handlers/gameHandlers.ts`

Compatibility impact:

- The Media Session API is not a Baseline web feature and is not guaranteed across all major browsers.
- The current code does not guard with `if ("mediaSession" in navigator)`.
- If a claimed browser does not expose `navigator.mediaSession`, entering a game can throw before initialization completes.
- This is the main compatibility risk found for the Firefox claim.

Recommended fix before evaluation:

```ts
if ("mediaSession" in navigator) {
	navigator.mediaSession.setActionHandler("play", function () {});
	navigator.mediaSession.setActionHandler("pause", function () {});
	navigator.mediaSession.setActionHandler("seekbackward", function () {});
	navigator.mediaSession.setActionHandler("seekforward", function () {});
	navigator.mediaSession.setActionHandler("previoustrack", function () {});
	navigator.mediaSession.setActionHandler("nexttrack", function () {});
	navigator.mediaSession.setActionHandler("stop", function () {});
}
```

### Clipboard

The game settings view copies the room code with `navigator.clipboard.writeText(...)`:

- `services/frontend/src/pages/PGame/PGameViews/PGameSettings.tsx`

Compatibility impact:

- Clipboard writing is widely available in modern browsers but requires a secure context.
- The current code does not catch rejection from `writeText()`.
- If the browser blocks clipboard access, the game itself still works, but the copy button can incorrectly show the copied state.

### Local Storage

The frontend stores non-critical preferences in `localStorage`:

- language preference
- default game volume
- default mute state

Relevant files:

- `services/frontend/src/localization/localization.ts`
- `services/frontend/src/handlers/gameHandlers.ts`

Compatibility impact:

- Normal Chrome, Firefox, and Brave sessions support this.
- The localization code handles storage access errors.
- The game volume/mute code does not wrap `localStorage` access in `try/catch`, so very restrictive privacy modes or disabled storage could affect game initialization or volume changes.

### Modern JavaScript APIs

The frontend uses modern APIs without legacy polyfills:

- `structuredClone`
- `String.prototype.replaceAll`
- `crypto.randomUUID`
- `URL.createObjectURL`
- `Intl.NumberFormat`
- `Intl.DateTimeFormat`

Relevant files:

- `services/frontend/src/handlers/gameHandlers.ts`
- `services/frontend/src/components/contexts/CAppNotifContext.tsx`
- `services/frontend/src/components/layout/CLanguageProvider.tsx`
- `services/frontend/src/localization/localization.ts`
- `services/frontend/src/pages/PProfilePage/PProfileAvatarEditor.tsx`
- `services/frontend/src/utils/image.ts`

Compatibility impact:

- These are acceptable for latest stable Chrome, Firefox, and Brave.
- This project should not claim compatibility with old browser versions unless the build is changed to include a legacy target/polyfills.
- `vite.config.ts` does not configure a legacy plugin or an older browser build target.

### Styling and Layout

The frontend relies mostly on React, Material UI, CSS flex/grid behavior, media queries, and standard CSS filters.

Notable browser-sensitive styling:

- `backdropFilter` in the footer is cosmetic.
- `::-webkit-scrollbar` rules only affect Chromium-style scrollbar styling and do not break Firefox.
- CSS blur/filter usage is cosmetic or visibility-related and should work in current Chrome, Firefox, and Brave.

Compatibility impact:

- No blocking CSS compatibility issue was found for the claimed browsers.
- Visual differences in scrollbars and backdrop blur are acceptable as long as layout and interaction remain correct.

## Evaluation Checklist

Run the same production deployment in each claimed browser:

- Chrome latest stable
- Firefox latest stable
- Brave latest stable

Use `https://localhost` and accept the local certificate warning.

Check these flows:

- Register, login, refresh after page reload, logout.
- Guest profile creation and guest-to-auth transition.
- Duplicate tab login/logout propagation.
- Profile update and avatar upload.
- Friend request, friend accept/refuse, friend removal.
- Notifications and marking notifications as read.
- Direct chat.
- Room list, room creation, room joining.
- Public, friends-only, and private room visibility.
- Game settings: genres, track count, round duration, break duration, answer visibility, fuzzy matching, score mode.
- Copy room code.
- Multiplayer game start from at least two browser tabs.
- Audio preview playback after a user interaction.
- Answer submission with keyboard Enter and numpad Enter.
- Round transition, game end, and game restart.
- In-game chat.
- Language switching.
- Responsive layouts at desktop and narrow widths.

## External References

- MDN: BroadcastChannel - https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel
- MDN: Clipboard `writeText()` - https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
- MDN: Media Session API - https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API
- MDN: `structuredClone()` - https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone
- MDN: `crypto.randomUUID()` - https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID
- MDN: `String.prototype.replaceAll()` - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll
