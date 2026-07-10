import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import { appPositions } from "../../styles/theme";
import { Box, Stack } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../components/contexts/CLanguageProvider";
import { isKeyboardSubmit } from "../../utils/keyboard";
import CText from "../../components/text/CText";

const GAME_CODE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function PJoinRoom() {
	const [gameCode, setGameCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const { ttr } = useLang();

	const validateGameCode = (value: string): boolean => {
		const roomCode = value.trim();
		if (!roomCode) {
			return false;
		}
		if (!GAME_CODE_PATTERN.test(roomCode)) {
			return false;
		}
		return true;
	};

	const handleJoinRoom = () => {
		const roomCode = gameCode.trim();
		if (!validateGameCode(roomCode)) return;
		navigate(`/game/${encodeURIComponent(roomCode)}`);
	};

	return (
		<CTitlePaper title="JOIN_ROOM">
			<Stack>
				<CTextField
					sx={{ m: 0 }}
					label={ttr("GAME_ROOM_CODE")}
					value={gameCode}
					onChange={(event) => {
						const value = event.target.value;
						setGameCode(value);
						if (!validateGameCode(value) && value.trim()) setError("INVALID_GAME_CODE");
						else setError(null);
					}}
					onKeyUp={(event) => {
						if (isKeyboardSubmit(event)) handleJoinRoom();
					}}
				/>
				<Box sx={{ minHeight: 24, mt: 1, mb: 1 }}>
					{error ? (
						<CText color="error.main" size="sm" sx={{ m: 0, mx: 1 }}>
							{error}
						</CText>
					) : null}
				</Box>
				<CButtonText
					sx={{ ml: "auto", height: appPositions.sizes.buttons.home }}
					onClick={handleJoinRoom}
					disabled={!validateGameCode(gameCode)}
				>
					JOIN
				</CButtonText>
			</Stack>
		</CTitlePaper>
	);
}

export default PJoinRoom;
