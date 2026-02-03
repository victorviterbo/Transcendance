export interface IAuthUser {
	id: number;
	username: string;
	email: string;
}

export type TAuthStatus = "loading" | "authed" | "guest";
