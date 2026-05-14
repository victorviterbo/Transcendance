import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import { appPositions } from "../../styles/theme";
import { Stack } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ttr } from "../../localization/localization";

function PJoinRoom() {
	const [gameCode, setGameCode] = useState("");
	const navigate = useNavigate();

	const handleJoinRoom = () => {
		const roomCode = gameCode.trim();
		if (!roomCode) return;
		navigate(`/game/${encodeURIComponent(roomCode)}`);
	};

	return (
		<CTitlePaper title="JOIN_ROOM" sx={{ m: 0, height: "100%", width: "100%" }}>
			<CTextField
				sx={{ m: 0, mb: 2, width: "100%" }}
				label={ttr("GAME_ROOM_CODE")}
				value={gameCode}
				onChange={(event) => setGameCode(event.target.value)}
			/>
			<Stack direction="row">
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
