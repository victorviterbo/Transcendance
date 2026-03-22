import api from "./client";
import { API_PROFILE } from "../constants";
import { type IProfileData } from "../types/profile";

export const fetchProfile = async (username: string): Promise<IProfileData> => {
	const response = await api.get<IProfileData>(
		`${API_PROFILE}?q=${encodeURIComponent(username)}`,
	);
	return response.data;
};

export const uploadProfileImage = async (file: File): Promise<IProfileData> => {
	const formData = new FormData();
	formData.append("image", file);
	const response = await api.post<IProfileData>(API_PROFILE, formData);
	return response.data;
};

export const resolveProfileImage = (image?: string | null): string | undefined => {
	if (!image) return undefined;
	if (image.startsWith("http://") || image.startsWith("https://")) return image;
	if (image.startsWith("/")) {
		return new URL(image, window.location.origin).toString();
	}
	return new URL(`/${image}`, window.location.origin).toString();
};
