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
	user: IGamePlayer;
	position: number;
}

//TODO: REMEMBER TO PUT THE NO TR
function PGameLBoardNode({ user, position }: PGameLBoardNodeProps) {
	return (
		<Stack direction={"row"} sx={PGameLBoardNodeStyle(position, user.user.relation == "self")}>
			<CText sx={PGameLBoardNodePosStyle}>{position + 1 + "."}</CText>
			<CAvatar src={user.user.image} />
			<CText noTr={true} sx={PGameLBoardNodeUsernameStyle}>
				{user.user.username}
			</CText>
			<CText sx={PGameLBoardNodePtsStyle}>{user.points}</CText>
		</Stack>
	);
}

export default PGameLBoardNode;
