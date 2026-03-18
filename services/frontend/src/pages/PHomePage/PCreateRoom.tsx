import { Stack } from "@mui/material";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CToggle from "../../components/inputs/toggle/CToggle";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import { appPositions } from "../../styles/theme";
import CText from "../../components/text/CText";

function PCreateRoom() {
	return (
		<CTitlePaper title="CREATE_ROOM" sx={{ m: 0, height: "100%", width: "100%", flex: 1 }}>
			<Stack
				spacing={2.5}
				sx={{
					flex: 1,
					minHeight: "100%",
					justifyContent: "space-between",
				}}
			>
				<CText size="sm" sx={{ color: "rgba(255, 255, 255, 0.82)", lineHeight: 1.5 }}>
					Start a fresh round, pick who gets access, and invite people in without losing
					the playful arcade feel.
				</CText>
				<CTextField
					label="ROOM_NAME"
					placeholder="Name your room"
					sx={{ m: 0, width: "100%" }}
				></CTextField>
				<Stack
					direction={{ xs: "column", sm: "row" }}
					spacing={2}
					sx={{
						justifyContent: "space-between",
						alignItems: "stretch",
					}}
				>
					<CToggle
						sx={{ minHeight: appPositions.sizes.buttons.home, flex: 1 }}
						options={[
							{ value: "private", label: "PRIVATE" },
							{ value: "public", label: "PUBLIC" },
						]}
					></CToggle>
					<CButtonText
						sx={{
							height: appPositions.sizes.buttons.home,
							width: { xs: "100%", sm: "auto" },
							justifyContent: "center",
						}}
					>
						PLAY_GAME
					</CButtonText>
				</Stack>
			</Stack>
		</CTitlePaper>
	);
}

export default PCreateRoom;
