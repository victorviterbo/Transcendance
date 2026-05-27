import { Box, Stack } from "@mui/material";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CToggle from "../../components/inputs/toggle/CToggle";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import { appPositions } from "../../styles/theme";
import { ttr } from "../../localization/localization";
import { useState } from "react";
import type { TGameVisibility } from "../../types/game";
import { useNavigate } from "react-router-dom";
import { createGame } from "../../api";
import CText from "../../components/text/CText";
import { getErrorMessage } from "../../utils/error";

function PCreateRoom() {
	const [name, setName] = useState("");
	const [visibility, setVisibility] = useState<TGameVisibility>("private");
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

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
					onChange={(event) => setName(event.target.value)}
				/>
				<Box sx={{ minHeight: 24, mt: 1, mb: 1 }}>
					{error ? (
						<CText color="error.main" size="sm" sx={{ m: 0, mx: 1 }}>
							{error}
						</CText>
					) : null}
				</Box>
				<Stack direction={"row"} sx={{ justifyContent: "space-between" }}>
					<CToggle
						sx={{ height: appPositions.sizes.buttons.home }}
						value={visibility}
						options={[
							{ value: "private", label: "PRIVATE" },
							{ value: "friends", label: "FRIENDS" },
							{ value: "public", label: "PUBLIC" },
						]}
						onValueChanged={(value) => {
							if (value) setVisibility(value as TGameVisibility);
						}}
					/>
					<CButtonText onClick={handleCreateRoom} disabled={!name.trim() || isCreating}>
						{isCreating ? "CREATING_GAME" : "CREATE_GAME"}
					</CButtonText>
				</Stack>
			</Stack>
		</CTitlePaper>
	);
}

export default PCreateRoom;
