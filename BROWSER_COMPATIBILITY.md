## Browser Compatibility

This project was developed and primarily tested on **Google Chrome**. The application is designed for current desktop browsers and uses standard web APIs for authentication, real-time communication, audio playback, and responsive layouts.

Core features work in current Chrome, Firefox, and Brave desktop browsers. Safari and mobile browsers are supported on a best-effort basis because audio playback, page lifecycle, and device permissions are controlled differently by each browser and operating system.

## Supported Browsers

| Browser         | Version        | Status                                                  |
| --------------- | -------------- | ------------------------------------------------------- |
| Google Chrome   | Current stable | Primary development and evaluation browser              |
| Mozilla Firefox | Current stable | Supported; minor browser-specific differences may occur |
| Brave           | Current stable | Supported with default privacy settings                 |
| Safari desktop  | Current stable | Best effort; Safari-specific behavior is not guaranteed |
| Microsoft Edge  | Current stable | Expected to work; Chromium-based                        |
| Mobile browsers | Current stable | Best effort; see mobile limitations below               |

The application must be opened through the HTTPS deployment. When using the local deployment, the browser must accept the self-signed certificate warning before cookies, clipboard access, and secure WebSockets can work as intended.

## Browser-Specific Limitations

### Google Chrome

Chrome is the primary development and evaluation browser. No blocking Chrome-specific limitation is currently known.

### Mozilla Firefox

Core features are supported, including authentication, room management, gameplay, WebSocket synchronization, chat, notifications, and responsive layouts.

Expected differences include:

- Audio autoplay decisions may differ from Chrome.
- Minor CSS rounding or font-rendering differences may appear at some viewport sizes.
- Privacy settings can affect cookies, local storage, clipboard access, or cross-tab authentication updates.
- WebSocket reconnection can briefly change the visible connection state after browser history navigation or a network interruption.

### Brave

Brave is expected to behave similarly to Chrome because it uses Chromium. The application is compatible with the default Brave configuration.

Strict or customized Shields can block or alter cookies, storage, clipboard access, audio previews, WebSockets, or cross-tab communication. One should use the default Shields configuration.

### Safari

Safari desktop may run the application, but it is not the primary compatibility target. Differences may occur in audio autoplay, media controls, WebSocket lifecycle handling, CSS rendering, and browser privacy behavior.

Safari on iOS has the most significant known limitation: it can require a fresh user interaction before audio playback. A user may see an interaction dialog at the start of a round or at later rounds, even after previously interacting with the page.

This limitation affects local music only. The user can continue participating in the game, and other players are not affected.

### Microsoft Edge

Current Edge is expected to work similarly to Chrome because it uses the Chromium rendering and JavaScript engines. Edge was not the primary development browser, so minor differences in audio policy, privacy settings, or rendering remain possible.

## Mobile Browsers

Mobile is not the primary target platform. The responsive interface is available, but mobile browsers impose additional restrictions that do not apply in the same way on desktop.

Known mobile behavior:

- Audio may require an explicit interaction before every round or after the page loses focus.
- Mobile Safari may display an interaction dialog at multiple rounds.
- Browser address bars and virtual keyboards can change the available viewport height while the application is open.
- Backgrounding the browser can pause or close the WebSocket. The connection is recreated when the page becomes active again.
- Some browsers and devices expose the currently playing music through phone, lock-screen, or connected-device media widgets.
- When available, those media controls affect music for that player only. They do not pause the game or affect other players.
- Clipboard access depends on browser permission and the current secure context.
- Very small screens may require scrolling to reach all controls.

Gameplay, chat, notifications, and synchronization are intended to remain functional, but audio playback and background behavior cannot be guaranteed identically across mobile browsers.

## Browser Storage and Privacy Settings

The application uses cookies and browser storage for authentication, language preferences, and local game preferences.

- Private or incognito windows have separate cookies and storage from normal windows.
- Closing a private browsing session may remove authentication and preferences.
- Strict tracking protection, disabled storage, or privacy extensions can prevent expected authentication or cross-tab behavior.
- Browser extensions can modify requests, WebSockets, cookies, storage, or page scripts and are outside the supported environment.
- Testing the frontend and backend on different origins can introduce cookie restrictions that do not apply to the intended same-origin HTTPS deployment.

For evaluation, use a normal browser profile with default privacy settings and extensions disabled or controlled.

## Known Audio and Media Behavior

The application uses external audio previews. Playback depends on both browser policy and the preview source:

- The browser may block playback without a user gesture.
- A preview may fail if the external source is unavailable, uses an unsupported format, or does not allow the required cross-origin request.
- Browsers that support Media Session may expose local pause or stop controls through device or operating-system media widgets.
- Media Session support is optional. Its absence does not prevent the application or game from loading.
- Local playback failures do not affect answers, scoring, game events, chat, notifications, or other players.

## Testing Methodology

Browser checks cover the following application areas:

- Authentication, logout, page reload, and session restoration.
- Guest profiles and authenticated profiles.
- Profile updates and profile pictures.
- Friends, notifications, and direct chat.
- Room creation, room discovery, visibility settings, and joining.
- Multiplayer gameplay and real-time WebSocket synchronization.
- In-game chat, answer submission, scoring, round transitions, and results.
- Audio playback after user interaction.
- Language selection and responsive layouts.
- WebSocket recovery after page navigation and connection interruption.

Behavior described as browser-specific above is an accepted limitation of the browser or device environment, not a difference in the game rules or server-side state.
