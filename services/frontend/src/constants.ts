// AUTH ENDPOINTS
export const API_AUTH_REFRESH = "/api/auth/refresh/";
export const API_AUTH_LOGOUT = "/api/auth/logout/";
export const API_AUTH_LOGIN = "/api/auth/login/";
export const API_AUTH_REGISTER = "/api/auth/register/";
export const API_ACCOUNT_DELETE = "/api/auth/delete/";
export const API_PROFILE_PASSWORD = "/api/auth/password/";

// PROFILE ENDPOINTS
export const API_PROFILE = "/api/profile/";
export const API_PROFILE_SEARCH = `${API_PROFILE}search/`;
export const API_PROFILE_GUEST_CREATE = `${API_PROFILE}guest-create/`;
export const API_PROFILE_GUEST_DELETE = `${API_PROFILE}guest-delete/`;

// STATS ENDPOINTS
export const API_STATS_GLOBAL = "/api/stats/global/";
export const API_STATS_LEADERBOARD = "/api/stats/leaderboard/";
export const API_STATS_HISTORY = "/api/stats/history/";

// SOCIAL ENDPOINTS
export const API_SOCIAL_FRIENDS = "/api/social/friends/";
export const API_SOCIAL_FRIENDS_SEARCH = "/api/social/friends-search/";
export const API_SOCIAL_FRIENDS_REQUEST = "/api/social/friends-request/";
export const API_SOCIAL_FRIENDS_REQUEST_SEND = "/api/social/friend-request/send/";
export const API_SOCIAL_FRIENDS_REQUEST_RESPOND = "/api/social/friend-request/respond/";
export const API_SOCIAL_FRIEND_REMOVE = "/api/social/friend/remove/";
export const API_SOCIAL_FRIENDS_MESSAGE_FEED = "/api/social/message/";
export const API_SOCIAL_NOTIFS = "/api/social/notifs/";
export const API_SOCIAL_NOTIFS_READ = "/api/social/notifs_read/";

//GAME
export const API_CREATE_GAME = "/api/game/";
export const API_GAME_FRIENDS = "/api/game/friends/";
export const API_GAME_PUBLIC = "/api/game/";
export const API_GAME = "/api/game/{ROOMID}/";
export const PAGE_GAME = "/game/{UID}";

// WS
export const WS_ADRESS_WMS = "ws://localhost:5173/";
export const WS_ADRESS = "ws://localhost:8000/ws/global/";

export const MUSIC_TAGS = [
	"TAG_POP",
	"TAG_RAP",
	"TAG_ROCK",
	"TAG_ELECTRO",
	"TAG_FRENCH_VARIETY",
	"TAG_RNB",
] as const;

// TIME CONVERSIONS
export const DAY_MS = 1000 * 60 * 60 * 24;
export const HOUR_MS = 1000 * 60 * 60;
export const MINUTE_MS = 1000 * 60;

// GAME
export const GAME_COUNTDOWNM_TIME_MS = 3000;
export const GAME_MAX_ROUND_DISPLAYED = 11;
export const GAME_ROUND_PASSED_DISPLAYED = 8;
export const GAME_MAX_ROUND_DISPLAYED_SMALL = 5;
export const GAME_ROUND_PASSED_DISPLAYED_SMALL = 3;
export const GAME_ENDED_MAX = 9999;

// SETTINGS
export const SETTINGS_NGSONGS_MIN = 5;
export const SETTINGS_NGSONGS_MAX = 50;
export const SETTINGS_NGSONGS_STEP = 1;

export const SETTINGS_SONG_DURATION_MIN = 5;
export const SETTINGS_SONG_DURATION_MAX = 30;
export const SETTINGS_SONG_DURATION_STEP = 5;

export const SETTINGS_BREAK_DURATION_MIN = 5;
export const SETTINGS_BREAK_DURATION_MAX = 30;
export const SETTINGS_BREAK_DURATION_STEP = 5;
