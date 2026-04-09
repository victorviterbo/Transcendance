import { LoginHandler, RegisterHandler, RefreshHandler, LogoutHandler } from "./handlers/auth";
import {
	ChangePasswordHandler,
	DeleteProfileHandler,
	GetMeHandler,
	PatchMeHandler,
	ProfileSearchHandler,
} from "./handlers/users";
import { FetchPrivateRoom, FetchPublicRoom } from "./handlers/home";
import {
	friendsListHandler,
	friendsRequestsHandler,
	friendsRequestsResponseHandler,
	friendsRequestsSendHandler,
	friendsSearchHandler,
} from "./handlers/social/social";
import { friendMessageHandler } from "./handlers/social/socialChat";
import { socketConnHandler } from "./handlers/ws/websocket";

export const handlers = [
	LoginHandler,
	RegisterHandler,
	RefreshHandler,
	LogoutHandler,
	GetMeHandler,
	PatchMeHandler,
	ChangePasswordHandler,
	DeleteProfileHandler,
	ProfileSearchHandler,
	FetchPrivateRoom,
	FetchPublicRoom,

	friendsListHandler,
	friendsSearchHandler,
	friendsRequestsHandler,
	friendsRequestsSendHandler,
	friendsRequestsResponseHandler,
	friendMessageHandler,

	socketConnHandler,
];
