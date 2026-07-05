import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import { appPositions } from "../../styles/theme";
import { Box, Stack } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../components/layout/CLanguageProvider";

function PJoinRoom() {
	const [gameCode, setGameCode] = useState("");
	const navigate = useNavigate();
	const { ttr } = useLang();

	const handleJoinRoom = () => {
		const roomCode = gameCode.trim();
		if (!roomCode) return;
		navigate(`/game/${encodeURIComponent(roomCode)}`);
	};

	return (
		<CTitlePaper title="JOIN_ROOM">
			<Stack>
				<CTextField
					sx={{ m: 0 }}
					label={ttr("GAME_ROOM_CODE")}
					value={gameCode}
					onChange={(event) => setGameCode(event.target.value)}
					onKeyUp={(event) => {
						if (event.code == "Enter") handleJoinRoom();
					}}
				/>
				<Box sx={{ minHeight: 24, mt: 1, mb: 1 }} />
				<CButtonText
					sx={{ ml: "auto", height: appPositions.sizes.buttons.home }}
					onClick={handleJoinRoom}
					disabled={!gameCode.trim()}
				>
					JOIN
				</CButtonText>
			</Stack>
		</CTitlePaper>
	);
}

export default PJoinRoom;
