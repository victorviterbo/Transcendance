import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import { Avatar, Box, CircularProgress, DialogActions, IconButton, Stack } from "@mui/material";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import CDialog from "../../components/feedback/dialogs/CDialog";
import CText from "../../components/text/CText";
import { resolveProfileImage, uploadProfileImage } from "../../api/profile";
import { type IProfileData } from "../../types/profile";
import CDialogTitle from "../../components/feedback/dialogs/CDialogTitle";
import { getErrorMessage } from "../../utils/error";
import { validateImageFile } from "../../utils/image";

interface ProfileAvatarEditorProps {
	username: string;
	avatar?: string | null;
	onUploaded: (profile: IProfileData) => void;
}

const normalizeUploadError = (uploadError: unknown) => {
	const message = getErrorMessage(uploadError, "UPLOAD_FAILED");
	if (message === "INVALID" || message === "INVALID_IMAGE") return "PROFILE_IMAGE_INVALID_FILE";
	return message;
};

function PProfileAvatarEditor({ username, avatar, onUploaded }: ProfileAvatarEditorProps) {
	const [open, setOpen] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const previewUrl = useMemo(() => {
		if (!selectedFile) return null;
		return URL.createObjectURL(selectedFile);
	}, [selectedFile]);

	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	const resetDialog = () => {
		setOpen(false);
		setSelectedFile(null);
		setError(null);
	};

	const handleChooseFile = () => {
		inputRef.current?.click();
	};

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] ?? null;
		event.target.value = "";
		if (!file) return;
		setSelectedFile(file);

		const validationError = await validateImageFile(file);
		if (validationError) {
			setError(validationError);
			return;
		}

		setError(null);
	};

	const handleUpload = async () => {
		if (!selectedFile) return;
		setIsUploading(true);
		setError(null);
		try {
			const updatedProfile = await uploadProfileImage(selectedFile);
			onUploaded(updatedProfile);
			resetDialog();
		} catch (uploadError) {
			setError(normalizeUploadError(uploadError));
		} finally {
			setIsUploading(false);
		}
	};

	const avatarSrc = previewUrl ?? resolveProfileImage(avatar);

	return (
		<>
			<Box sx={{ position: "relative", width: 88, height: 88 }}>
				<Avatar
					src={resolveProfileImage(avatar)}
					sx={{
						width: 88,
						height: 88,
						bgcolor: "secondary.main",
						fontWeight: "bold",
						fontSize: "2rem",
					}}
				>
					{username.charAt(0).toUpperCase()}
				</Avatar>
				<IconButton
					aria-label="Change profile picture"
					onClick={() => setOpen(true)}
					sx={{
						position: "absolute",
						right: -6,
						bottom: -6,
						backgroundColor: "secondary.main",
						opacity: 0.95,
						color: "secondary.contrastText",
						"&:hover": {
							backgroundColor: "secondary.dark",
						},
						border: (theme) => `1.5px solid ${theme.palette.divider}`,
					}}
				>
					<PhotoCameraIcon fontSize="small" />
				</IconButton>
			</Box>

			<input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />

			<CDialog
				open={open}
				onClose={() => {
					if (!isUploading) resetDialog();
				}}
				fullWidth
				maxWidth="xs"
			>
				<Stack spacing={2} alignItems="center" sx={{ pt: 1 }}>
					<CDialogTitle>UPDATE_PROFILE_PICTURE</CDialogTitle>
					<Avatar
						src={avatarSrc ?? undefined}
						sx={{
							width: 132,
							height: 132,
							bgcolor: "secondary.main",
							fontWeight: "bold",
							fontSize: "3rem",
						}}
					>
						{username.charAt(0).toUpperCase()}
					</Avatar>
					<CText size="sm" color="text.secondary" sx={{ pt: 1 }}>
						CHOOSE_PICTURE_PREVIEW
					</CText>
					<CText size="sm" color="text.secondary" align="center">
						PROFILE_IMAGE_REQUIREMENTS
					</CText>
					{selectedFile && (
						<CText size="sm" textAlign="center">
							{selectedFile.name}
						</CText>
					)}
					{error && (
						<CText color="error.main" size="sm" sx={{ mt: 1 }}>
							{error}
						</CText>
					)}
					<DialogActions sx={{ px: 0, pb: 0, pt: 1 }}>
						<CButtonText onClick={resetDialog} disabled={isUploading}>
							CANCEL
						</CButtonText>
						<CButtonText onClick={handleChooseFile} disabled={isUploading}>
							CHOOSE_IMAGE
						</CButtonText>
						<CButtonText
							variant="contained"
							onClick={handleUpload}
							disabled={isUploading || !selectedFile || Boolean(error)}
						>
							{isUploading ? <CircularProgress size={18} color="inherit" /> : "SAVE"}
						</CButtonText>
					</DialogActions>
				</Stack>
			</CDialog>
		</>
	);
}

export default PProfileAvatarEditor;
