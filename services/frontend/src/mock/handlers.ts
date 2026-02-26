import { LoginHandler, RegisterHandler, RefreshHandler, LogoutHandler } from "./handlers/auth";
import { FetchPrivateRoom, FetchPublicRoom } from "./handlers/home";

export const handlers = [LoginHandler, RegisterHandler, RefreshHandler, LogoutHandler, FetchPublicRoom, FetchPrivateRoom];
