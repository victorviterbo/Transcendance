import api from "./client";
import { API_PROFILE, API_PROFILE_PASSWORD, API_ACCOUNT_DELETE } from "../constants";
import { type IProfileData } from "../types/profile";

export interface ProfileLevelProgressState {
	level: number;
	progressPercent: number;
}

export const getProfileLevelProgress = (
	xp: number,
	xpPerLevel = 100,
): ProfileLevelProgressState => {
	const safeXp = Math.max(0, Math.floor(xp));
	const safeXpPerLevel = xpPerLevel > 0 ? Math.floor(xpPerLevel) : 100;

	return {
		level: Math.floor(safeXp / safeXpPerLevel),
		progressPercent: Math.round(((safeXp % safeXpPerLevel) / safeXpPerLevel) * 100),
	};
};

export const fetchProfile = async (username: string): Promise<IProfileData> => {
	const response = await api.get<IProfileData>(
		`${API_PROFILE}?q=${encodeURIComponent(username)}`,
	);
	return response.data;
};

export const uploadProfileImage = async (file: File): Promise<IProfileData> => {
	const formData = new FormData();
	formData.append("avatar", file);
	const response = await api.post<IProfileData>(API_PROFILE, formData);
	return response.data;
};

export const changeProfilePassword = async (
	currentPassword: string,
	newPassword: string,
): Promise<{ description: string; access?: string; username?: string }> => {
	const response = await api.post<{ description: string; access?: string; username?: string }>(
		API_PROFILE_PASSWORD,
		{
		currentPassword,
		newPassword,
		},
	);
	return response.data;
};

export const deleteProfile = async (password: string): Promise<void> => {
	await api.post<{ description: string }>(API_ACCOUNT_DELETE, { password });
};

export const resolveProfileImage = (avatar?: string | null): string | undefined => {
	if (!avatar) return undefined;
	if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
	if (avatar.startsWith("/")) {
		return new URL(avatar, window.location.origin).toString();
	}
	return new URL(`/${avatar}`, window.location.origin).toString();
};
