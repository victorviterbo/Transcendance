import { Box, Grid, Stack } from "@mui/material";
import CText from "../../../components/text/CText";
import CTextField from "../../../components/inputs/textFields/CTextField";
import SendIcon from "@mui/icons-material/Send";
import CIconButton from "../../../components/inputs/buttons/CIconButton";
import { appTexts } from "../../../styles/theme";
import { PGameRoundGameProgressBoxStyle } from "../../../styles/pages/game/PGameRoundStyle";
import { ttrfn } from "../../../localization/localization";
import type { GPageProps } from "../../common/GPageBases";
import type { IGameData, IGameRound, IGameSettings, IGameStatus } from "../../../types/game";
import { useMemo, type ReactNode } from "react";
import PGameRoundStateNode from "./PGameRoundStateNode";
import CCounterCircular from "../../../components/feedback/loading/CCounterCircular";
import PGameRoundTracker from "./PGameRoundTracker";

interface PGameRoundProps extends GPageProps {
	game: IGameData;
	status: IGameStatus;
	settings: IGameSettings;
	rounds: IGameRound[];
}

function PGameRound({ status, rounds, settings }: PGameRoundProps) {
	//====================== MAPS ======================
	const roundHistory = useMemo((): ReactNode[] => {
		return rounds.map((round: IGameRound, index: number) => {
			return (
				<PGameRoundStateNode
					key={"round-node-" + index}
					round={round}
				></PGameRoundStateNode>
			);
		});
	}, [rounds]);

	//====================== STRUCTURE ======================
	return (
		<Stack
			direction={"column"}
			sx={{ position: "absolute", inset: "15px", overflowY: "auto", overflowX: "hidden" }}
		>
			<Box sx={PGameRoundGameProgressBoxStyle}>
				<Stack direction={"column"}>
					<Stack direction={"row"}>
						<CText>
							{ttrfn("GAME_ROUND_INDICATOR", {
								CURRENT: <span>{status.round + 1}</span>,
								MAX: <span>{settings.nbMusic}</span>,
							})}
						</CText>
						<Stack direction={"row"}>{roundHistory}</Stack>
					</Stack>
					<PGameRoundTracker
						settings={settings}
						status={status}
						round={rounds[status.round]}
					/>
				</Stack>
			</Box>
			<Box></Box>
			<Stack direction={"row"} sx={{ flex: 1 }}>
				<Grid sx={{ backgroundColor: "red", flex: 0.7 }}> </Grid>
				<Stack direction={"column"} sx={{ backgroundColor: "green", flex: 0.3 }}>
					<Grid></Grid>
					<Stack direction={"column"}></Stack>
				</Stack>
			</Stack>
			<Stack direction={"row"}>
				<CTextField
					sx={{ flex: 1, m: 0 }}
					fontWeight={500}
					fontFamily={appTexts.text.secondaryFamily}
					fontSize={appTexts.text.sizes.xs}
					borderWidth="2px"
					verticalPadding="10px"
					// value={messageField}
					// onChange={(event) => {
					// 	setMessageField(event.target.value);
					// }}
					// onKeyUp={(event) => {
					// 	if (event.code == "Enter") handleSendMessage();
					// }}
					data-testid="PGameChat-TextField"
				></CTextField>
				<CIconButton
					//onClick={handleSendMessage}
					sx={{ my: "auto", ml: "10px" }}
					data-testid="PGameChat-SendButton"
				>
					<SendIcon fontSize="small" />
				</CIconButton>
				<CCounterCircular min={0} max={30} variant="determinate" value={25} />
			</Stack>
		</Stack>
	);
}

export default PGameRound;
