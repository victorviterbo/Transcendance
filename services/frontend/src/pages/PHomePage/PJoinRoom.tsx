import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import CButtonText from "../../components/inputs/buttons/CButtonText";
import { appPositions } from "../../styles/theme";
import { Stack } from "@mui/material";
import CText from "../../components/text/CText";

function PJoinRoom() {
	return (
		<CTitlePaper title="JOIN_ROOM" sx={{ m: 0, height: "100%", width: "100%", flex: 1 }}>
			<Stack
				spacing={2.5}
				sx={{
					flex: 1,
					minHeight: "100%",
					justifyContent: "space-between",
				}}
			>
				<CText size="sm" sx={{ color: "rgba(255, 255, 255, 0.82)", lineHeight: 1.5 }}>
					Drop in with a code and get straight to the next music sprint. No clutter, just
					a clear lobby action.
				</CText>
				<CTextField
					label="ROOM_CODE"
					placeholder="ABCD-EFGH"
					sx={{ m: 0, width: "100%" }}
				></CTextField>
				<Stack direction="row">
					<CButtonText
						sx={{
							ml: "auto",
							height: appPositions.sizes.buttons.home,
							width: { xs: "100%", sm: "auto" },
							justifyContent: "center",
						}}
					>
						JOIN
					</CButtonText>
				</Stack>
			</Stack>
		</CTitlePaper>
	);
}

export default PJoinRoom;
