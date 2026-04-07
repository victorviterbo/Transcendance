import { LoginHandler, RegisterHandler, RefreshHandler, LogoutHandler } from "./handlers/auth";
import { GetMeHandler, PatchMeHandler, ProfileSearchHandler } from "./handlers/users";
import { FetchPrivateRoom, FetchPublicRoom } from "./handlers/home";
import {
	friendsListHandler,
	friendsRequestsHandler,
	friendsRequestsResponseHandler,
	friendsRequestsSendHandler,
	friendsSearchHandler,
} from "./handlers/social/social";
import { friendMessageHandler } from "./handlers/social/socialChat";

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
	friendsRequestsResponseHandler,
	friendMessageHandler,
];
