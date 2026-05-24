import { memo, useMemo } from "react";
import type { IGameRound } from "../../../types/game";
import type { GPageProps } from "../../common/GPageBases";
import { Stack } from "@mui/material";
import CText from "../../../components/text/CText";
import {
	PGameRoundStateNodeStyle,
	type IGameRoundStateNodeStyle,
} from "../../../styles/pages/game/PGameRoundStyle";

interface PGameRoundStateNodeProps extends GPageProps {
	round: IGameRound;
}

function PGameRoundStateNode({ round }: PGameRoundStateNodeProps) {
	const style: IGameRoundStateNodeStyle = useMemo(() => {
		return PGameRoundStateNodeStyle(round);
	}, [round]);

	return (
		<Stack sx={style.main}>
			<CText size="2xs">{round.points}</CText>
		</Stack>
	);
}

export default memo(PGameRoundStateNode);
