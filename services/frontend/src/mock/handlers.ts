import { LoginHandler, RegisterHandler, RefreshHandler, LogoutHandler } from "./handlers/auth";
import { GetMeHandler, PatchMeHandler, ProfileSearchHandler } from "./handlers/users";

export const handlers = [
	LoginHandler,
	RegisterHandler,
	RefreshHandler,
	LogoutHandler,
	GetMeHandler,
	PatchMeHandler,
	ProfileSearchHandler,
];
