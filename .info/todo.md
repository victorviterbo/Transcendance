# TODO: KRIS

- [ ] Better localization for notification times: remove the (s)
- [ ] Find a better workaround than the 150 ms voodoo shit
- [x] Make profile picture and username be links that navigate to /users/{username}
- [ ] Message notifications
- [ ] Change notification message to accept coloring and {username}
- [ ] Maybe switch to websockets for friends?
- [ ] Redo search timeout
- [ ] Index-derived keys are used in: 
	- `services/frontend/src/pages/PSocial/PFriendAdd.tsx`
	- `services/frontend/src/pages/PSocial/PFriendList.tsx`
	- `services/frontend/src/pages/PSocial/PFriendReq.tsx`
	- `services/frontend/src/pages/PNotif/index.tsx`
- [ ] Modify API images in IExtUser and IFriendInfo:
- [ ] Message failed not showing 
- [ ] useParams(); for room id;

# TODO: FAB
- [ ] Add verification on who calls for game endpoints
- [x] Check get_relation
- [x] Ajouter game name au serialiser game get, ainsi que l'id plutot que l'uid + les genres et le public_level

# BUG

- [ ] BUG#0001: Web socket error when creating new account
- [ ] BUG#0002: Issue when server restart while loggin and connected
- [x] BUG#0003: Chat stays open after nmotification click
- [x] BUG#0004: Friends appear in add search
- [x] BUG#0005: Chat messages get automatically translated
- [ ] BUG#0006: Player_1 gets 301 then 500 on stats endpoint for some reason
- [~] BUG#0007: Usernames can trigger ttr();
- [ ] BUG#0008: default profile picture is not the same from friends list and profile page;
- [ ] BUG#0009: When loging / lougout an error is triggered on the backend logs;

# TO CHECK

- Auth refresh is wired to status in CAuthProvider.tsx (line 43), so login/register success triggers an extra refresh request immediately after setAuth. If that second call fails, a valid login can bounce straight back to guest state.
- Deployment config is inconsistent: HTTP uses VITE_API_URL in api/client.ts (line 29), but websocket URLs are hardcoded localhost values in constants.ts (line 35), and profile image URLs are rebuilt from window.location.origin in api/profile.ts (line 55). That’s going to be awkward outside a same-origin local setup.
- Friend search is race-prone. In PFriendAdd.tsx (line 16), the debounce timer lives in a render-local variable, there’s no cleanup, and there’s no guard against older responses overwriting newer search results.
- Logout handling is shaky: CNavbar.tsx (line 56) calls async logout() fire-and-forget, while CAuthProvider.tsx (line 61) only clears auth after the request succeeds. A failed logout request can leave the UI in a stale auth state.
- Localization data is messy and order-dependent. ttr() in localization.ts (line 132) silently keeps the last matching ID, and lang.csv has duplicates like line 8 (line 8) and line 86 (line 86) for WELCOME, plus 3 (line 3) and 113 (line 113) for CHANGE_EMAIL.
- Language switching is implemented by registering a global callback during render in CLanguageLayout.tsx (line 13) and forcing a subtree remount with key={lang} at line 18 (line 18). It’s effective, but it’s a brute-force reset, not a clean reactive localization model.
- The frontend still has a lot of rough hygiene signals: magic-number friend tabs and the 1 -> 0 timeout hop in GPageBases.tsx (line 42), CMenu forgetting to call useId in CMenu.tsx (line 14), data-testid="hello" in CTitleBasePaper.tsx (line 54), and a lot of typo drift like WS_ADRESS, PWelcomLogin, USERS_ADD_EROOR, TAG_ELECRO, and recieved.

# ????

- The websocket layer only supports one callback per module via setOnUpdate, stored on a mutable module object in CWebsocket.tsx (line 47). Combined with the mutation-heavy consumers above, that’s a pretty fragile event model.
- Social lists use index-derived keys while rows keep local state. See PFriendList.tsx (line 66), PFriendAdd.tsx (line 50), PFriendReq.tsx (line 61), and local row state in PFriendNode.tsx (line 46). If items are inserted/reordered, the wrong relation/error state can stick to the wrong user.
