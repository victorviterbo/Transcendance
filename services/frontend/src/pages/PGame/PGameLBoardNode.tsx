import { Stack } from "@mui/material"
import type { GPageProps } from "../common/GPageBases"
import CAvatar from "../../components/images/CAvatar"
import CText from "../../components/text/CText"
import type { IGamePlayer } from "../../types/game"

interface PGameLBoardNodeProps extends GPageProps
{
	user: IGamePlayer
}

//TODO: REMEMBER TO PUT THE NO TR
function PGameLBoardNode({user}: PGameLBoardNodeProps) {
	return <Stack direction={"row"}>
		<CAvatar src={user.user.image} />
		<CText>{user.user.username}</CText>
		<CText>{user.points}</CText>
	</Stack>
}

export default PGameLBoardNode