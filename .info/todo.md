# TODO: KRIS

- [ ] Better localization for notification times: remove the (s)
- [ ] Find a better workaround than the 150 ms voodoo shit
- [ ] Make profile picture and username be links that navigate to /users/{username}

# BUG

- [ ] BUG#0001: Web socket error when creating new account
- [ ] BUG#0002: Issue when server restart while loggin and connected
- [ ] BUG#0003: Chat stays open after nmotification click
- [ ] BUG#0004: Friends appear in add search
- [ ] BUG#0005: Chat messages get automatically translated
- [ ] BUG#0006: Player_1 gets 301 then 500 on stats endpoint for some reason
- [ ] BUG#0007:

---

- Highest-risk weirdness is the text abstraction: CTextBase.tsx (line 37) auto-runs ttr() on every string child. That means dynamic/user content can be silently “translated” if it matches a localization key. Examples: chat text in PFriendChatNode.tsx (line 36), usernames/badges in PFriendNode.tsx (line 103), leaderboard usernames in PLeaderboardRow.tsx (line 94).
- Social/websocket state is updated by mutating React state objects in place and then structuredCloneing them. That pattern is all over PNotif/index.tsx (line 81), PFriendReq.tsx (line 85), and PFriendChat.tsx (line 36). It works until it doesn’t: stale closures, racey updates, and hard-to-reason-about bugs.
- The websocket layer only supports one callback per module via setOnUpdate, stored on a mutable module object in CWebsocket.tsx (line 47). Combined with the mutation-heavy consumers above, that’s a pretty fragile event model.
- Social lists use index-derived keys while rows keep local state. See PFriendList.tsx (line 66), PFriendAdd.tsx (line 50), PFriendReq.tsx (line 61), and local row state in PFriendNode.tsx (line 46). If items are inserted/reordered, the wrong relation/error state can stick to the wrong user.
- Auth refresh is wired to status in CAuthProvider.tsx (line 43), so login/register success triggers an extra refresh request immediately after setAuth. If that second call fails, a valid login can bounce straight back to guest state.
- Deployment config is inconsistent: HTTP uses VITE_API_URL in api/client.ts (line 29), but websocket URLs are hardcoded localhost values in constants.ts (line 35), and profile image URLs are rebuilt from window.location.origin in api/profile.ts (line 55). That’s going to be awkward outside a same-origin local setup.
- Friend search is race-prone. In PFriendAdd.tsx (line 16), the debounce timer lives in a render-local variable, there’s no cleanup, and there’s no guard against older responses overwriting newer search results.
- Logout handling is shaky: CNavbar.tsx (line 56) calls async logout() fire-and-forget, while CAuthProvider.tsx (line 61) only clears auth after the request succeeds. A failed logout request can leave the UI in a stale auth state.
- Localization data is messy and order-dependent. ttr() in localization.ts (line 132) silently keeps the last matching ID, and lang.csv has duplicates like line 8 (line 8) and line 86 (line 86) for WELCOME, plus 3 (line 3) and 113 (line 113) for CHANGE_EMAIL.
- Language switching is implemented by registering a global callback during render in CLanguageLayout.tsx (line 13) and forcing a subtree remount with key={lang} at line 18 (line 18). It’s effective, but it’s a brute-force reset, not a clean reactive localization model.
- The frontend still has a lot of rough hygiene signals: magic-number friend tabs and the 1 -> 0 timeout hop in GPageBases.tsx (line 42), CMenu forgetting to call useId in CMenu.tsx (line 14), data-testid="hello" in CTitleBasePaper.tsx (line 54), and a lot of typo drift like WS_ADRESS, PWelcomLogin, USERS_ADD_EROOR, TAG_ELECRO, and recieved.
- The mock layer has at least one real bug too: mock/handlers/social/socialChat.ts (line 240) assigns instead of compares when finding a friend, so the mock websocket state is not trustworthy.
