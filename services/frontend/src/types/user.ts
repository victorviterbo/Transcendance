export interface IAuthUser {
	username: string;
	id?: number;
	email?: string;
}

export type TAuthStatus = "loading" | "authed" | "guest";
