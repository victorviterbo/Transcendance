import CGamePaper from "../../components/surfaces/CGamePaper";
import type { IGamePlayer } from "../../types/game";
import type { GPageProps } from "../common/GPageBases";
import PGameLBoardNode from "./PGameLBoardNode";
import { Stack } from "@mui/material";

interface PGameLBoardProps extends GPageProps {
	users: IGamePlayer[]
}

function PGameLBoard({ users }: PGameLBoardProps) {
	

	return (
		<CGamePaper
			title={"GAME_LEADER_BOARD"}
			overflow="hidden"
			contentFlex={1}
			isFlex={true}
			position="relative"
			sx={{
				height: "100%",
				display: "flex",
				overflow: "hidden",
			}}
		>
			<Stack
				sx={{
					position: "absolute",
					padding: "inherit",
					inset: 0,
					overflow: "auto",
				}}
			>
				{users.map((user: IGamePlayer, index: number) => {
					console.log(user);
					return (
						<PGameLBoardNode
							position={index}
							user={user}
							key={user.user.uid}
						></PGameLBoardNode>
					);
				})}
			</Stack>
		</CGamePaper>
	);
}

export default PGameLBoard;
