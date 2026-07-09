import { Box, Stack } from "@mui/material";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CToggle from "../../components/inputs/toggle/CToggle";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import { appPositions } from "../../styles/theme";
import { useState } from "react";
import type { TGameVisibility } from "../../types/game";
import { useNavigate } from "react-router-dom";
import { createGame } from "../../api";
import CText from "../../components/text/CText";
import { getErrorMessage } from "../../utils/error";
import LockIcon from "@mui/icons-material/Lock";
import GroupsIcon from "@mui/icons-material/Groups";
import PublicIcon from "@mui/icons-material/Public";
import { useLang } from "../../components/contexts/CLanguageProvider";
import { isKeyboardSubmit } from "../../utils/keyboard";

const GAME_NAME_MAX_LENGTH = 40;

function PCreateRoom() {
	const [name, setName] = useState("");
	const [visibility, setVisibility] = useState<TGameVisibility>("public");
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const { ttr } = useLang();

	const handleCreateRoom = async () => {
		const roomName = name.trim();
		if (!roomName) return;

		setIsCreating(true);
		setError(null);

		try {
			const game = await createGame({ name: roomName, visibility });
			navigate(`/game/${game.uid}`);
		} catch (error) {
			setError(getErrorMessage(error, "GAME_CREATION_FAILED"));
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<CTitlePaper title="CREATE_ROOM">
			<Stack>
				<CTextField
					sx={{ m: 0 }}
					label={ttr("GAME_NAME")}
					value={name}
					onChange={(event) => {
						if (event.target.value.trim().length <= GAME_NAME_MAX_LENGTH) {
							setName(event.target.value);
						}
					}}
					onKeyUp={(event) => {
						if (isKeyboardSubmit(event)) handleCreateRoom();
					}}
				/>
				<Box sx={{ minHeight: 24, mt: 1, mb: 1 }}>
					{error ? (
						<CText color="error.main" size="sm" sx={{ m: 0, mx: 1 }}>
							{error}
						</CText>
					) : null}
				</Box>
				<Stack
					direction={"row"}
					sx={{
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
						gap: 2,
					}}
				>
					<CToggle
						fontSize="sm"
						sx={{
							height: appPositions.sizes.buttons.home,
							"& .MuiToggleButton-root": {
								height: appPositions.sizes.buttons.home,
								minHeight: appPositions.sizes.buttons.home,
							},
							"& .MuiTypography-root": {
								m: 0,
								display: { xs: "none", sm: "block" },
							},
						}}
						value={visibility}
						options={[
							{
								value: "private",
								label: "PRIVATE",
								icon: <LockIcon fontSize="small" />,
							},
							{
								value: "friends",
								label: "FRIENDS",
								icon: <GroupsIcon fontSize="small" />,
							},
							{
								value: "public",
								label: "PUBLIC",
								icon: <PublicIcon fontSize="small" />,
							},
						]}
						onValueChanged={(value) => {
							if (value) setVisibility(value as TGameVisibility);
						}}
					/>
					<CButtonText
						sx={{ height: appPositions.sizes.buttons.home }}
						onClick={handleCreateRoom}
						disabled={!name.trim() || isCreating}
					>
						{isCreating ? "CREATING_GAME" : "CREATE_GAME"}
					</CButtonText>
				</Stack>
			</Stack>
		</CTitlePaper>
	);
}

export default PCreateRoom;
