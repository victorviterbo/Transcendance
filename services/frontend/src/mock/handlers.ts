import { LoginHandler, RegisterHandler, RefreshHandler, LogoutHandler } from "./handlers/auth";
import {
	ChangePasswordHandler,
	DeleteProfileHandler,
	GetMeHandler,
	PatchMeHandler,
	ProfileSearchHandler,
} from "./handlers/users";
import { FetchPrivateRoom, FetchPublicRoom } from "./handlers/home";
import { StatsGlobalHandler, StatsHistoryHandler, StatsLeaderboardHandler } from "./handlers/stats";
import {
	friendsListHandler,
	friendsRemoveHandler,
	friendsRequestsHandler,
	friendsRequestsResponseHandler,
	friendsRequestsSendHandler,
	friendsSearchHandler,
	notifRequestHandler,
	notifRequestHandlerRead,
} from "./handlers/social/social";
import { friendMessageHandler } from "./handlers/social/socialChat";
import { socketConnHandler } from "./handlers/ws/websocket";
import {
	gameRequestHandlerHost,
	gameRequestHandlerJoin,
	gameRequestHandlerPlaying,
} from "./handlers/game/game";

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
	StatsGlobalHandler,
	StatsLeaderboardHandler,
	StatsHistoryHandler,
	FetchPrivateRoom,
	FetchPublicRoom,

	socketConnHandler,

	friendsListHandler,
	friendsSearchHandler,
	friendsRequestsHandler,
	friendsRequestsSendHandler,
	friendsRequestsResponseHandler,
	friendsRemoveHandler,
	friendMessageHandler,
	notifRequestHandler,
	notifRequestHandlerRead,

	gameRequestHandlerJoin,
	gameRequestHandlerHost,
	gameRequestHandlerPlaying,
];
