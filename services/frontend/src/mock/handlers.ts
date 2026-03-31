import { LoginHandler, RegisterHandler, RefreshHandler, LogoutHandler } from "./handlers/auth";
import { GetMeHandler, PatchMeHandler, ProfileSearchHandler } from "./handlers/users";
import { FetchPrivateRoom, FetchPublicRoom } from "./handlers/home";
import {
	friendsListHandler,
	friendsRequestsHandler,
	friendsRequestsSendHandler,
	friendsSearchHandler,
} from "./handlers/social";

export const handlers = [
	LoginHandler,
	RegisterHandler,
	RefreshHandler,
	LogoutHandler,
	GetMeHandler,
	PatchMeHandler,
	ProfileSearchHandler,
	FetchPrivateRoom,
	FetchPublicRoom,
	// friendConnHandler,
	friendsListHandler,
	friendsSearchHandler,
	friendsRequestsHandler,
	friendsRequestsSendHandler,
];
