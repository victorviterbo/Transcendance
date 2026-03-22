const IMAGE_FILE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_FILE_SUPPORTED_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
	"image/bmp",
]);
const IMAGE_FILE_SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];

const hasSupportedImageFileType = (file: File) => {
	if (file.type) {
		return IMAGE_FILE_SUPPORTED_TYPES.has(file.type.toLowerCase());
	}
	const lowerName = file.name.toLowerCase();
	return IMAGE_FILE_SUPPORTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
};

const canDecodeImageFile = (file: File): Promise<boolean> => {
	return new Promise((resolve) => {
		const objectUrl = URL.createObjectURL(file);
		const image = new Image();
		const cleanup = () => URL.revokeObjectURL(objectUrl);

		image.onload = () => {
			cleanup();
			resolve(true);
		};
		image.onerror = () => {
			cleanup();
			resolve(false);
		};
		image.src = objectUrl;
	});
};

const validateImageFile = async (file: File): Promise<string | null> => {
	if (!hasSupportedImageFileType(file)) return "PROFILE_IMAGE_INVALID_TYPE";
	if (file.size <= 0) return "PROFILE_IMAGE_INVALID_FILE";
	if (file.size > IMAGE_FILE_MAX_SIZE_BYTES) return "PROFILE_IMAGE_TOO_LARGE";
	if (!(await canDecodeImageFile(file))) return "PROFILE_IMAGE_INVALID_FILE";
	return null;
};

export { validateImageFile };
