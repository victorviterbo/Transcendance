import { Stack } from "@mui/material";
import type { GPageProps } from "../common/GPageBases";
import CAvatar from "../../components/images/CAvatar";
import CText from "../../components/text/CText";
import type { IGamePlayer } from "../../types/game";
import {
	PGameLBoardNodeStyle,
	PGameLBoardNodeUsernameStyle,
	PGameLBoardNodePtsStyle,
	PGameLBoardNodePosStyle,
} from "../../styles/pages/game/PGameLBoardNodeStyle";

interface PGameLBoardNodeProps extends GPageProps {
	player: IGamePlayer;
	position: number;
}

//TODO: REMEMBER TO PUT THE NO TR
function PGameLBoardNode({ player, position }: PGameLBoardNodeProps) {
	return (
		<Stack
			direction={"row"}
			sx={PGameLBoardNodeStyle(
				position,
				player.self ? true : false,
				player.host ? true : false,
			)}
			data-testid="PGameLBoardNode"
		>
			<CText sx={PGameLBoardNodePosStyle}>{position + 1 + "."}</CText>
			<CAvatar src={player.player.avatar} />
			<CText noTr={true} sx={PGameLBoardNodeUsernameStyle}>
				{player.player.username}
			</CText>
			<CText sx={PGameLBoardNodePtsStyle}>{player.points}</CText>
		</Stack>
	);
}

export default PGameLBoardNode;
