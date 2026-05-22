import { memo } from "react";
import type { IGameRound } from "../../../types/game";
import type { GPageProps } from "../../common/GPageBases";
import { Stack } from "@mui/material";
import CText from "../../../components/text/CText";
import { PGameRoundStateNodeStyle } from "../../../styles/pages/game/PGameRoundStyle";

interface PGameRoundStateNodeProps extends GPageProps {
	round: IGameRound;
}

function PGameRoundStateNode({ round }: PGameRoundStateNodeProps) {
	return (
		<Stack sx={PGameRoundStateNodeStyle(round)}>
			<CText size="2xs">{round.points}</CText>
		</Stack>
	);
}

export default memo(PGameRoundStateNode);
