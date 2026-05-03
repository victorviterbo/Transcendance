import { Stack } from "@mui/material";
import { type IGameChatMsg, type IGamePlayer } from "../../types/game";
import type { GPageProps } from "../common/GPageBases";
import CText from "../../components/text/CText";
import { colorFromID } from "../../utils/styles";
import { appTexts } from "../../styles/theme";
import { PGameChatNodeStyle } from "../../styles/pages/game/PGameChatStyle";

interface PGameChatNodeProps extends GPageProps {
	message: IGameChatMsg;
	user: IGamePlayer;
}

function PGameChatNode({ message, user }: PGameChatNodeProps) {
	//====================== RETURS ======================
	if (message.type == "message" && message.message) {
		return (
			<Stack direction={"row"} sx={PGameChatNodeStyle()}>
				<CText
					noTr={true}
					family={appTexts.text.secondaryFamily}
					fontWeight={600}
					size="md"
				>
					<span style={{ color: colorFromID(user.colorid) }}>{user.user.username}</span>:{" "}
					{message.message}
				</CText>
			</Stack>
		);
	}

	return <></>;
}

export default PGameChatNode;
