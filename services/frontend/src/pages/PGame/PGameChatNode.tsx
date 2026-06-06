import { Box } from "@mui/material";
import { type IGameChatMsg, type IGamePlayer } from "../../types/game";
import type { GPageProps } from "../common/GPageBases";
import CText from "../../components/text/CText";
import { colorFromID } from "../../utils/styles";
import { appColors, appTexts } from "../../styles/theme";
import { PGameChatNodeStyle } from "../../styles/pages/game/PGameChatStyle";
import { ttrfn } from "../../localization/localization";
import { memo } from "react";

interface PGameChatNodeProps extends GPageProps {
	message: IGameChatMsg;
	user?: IGamePlayer;
}

function PGameChatNode({ message, user }: PGameChatNodeProps) {
	//====================== RETURS ======================
	if (message.type == "message" && message.message) {
		return (
			<Box sx={PGameChatNodeStyle()} data-testid="PGameChatNode">
				<CText
					noTr={true}
					family={appTexts.text.secondaryFamily}
					fontWeight={600}
					size="md"
					testid={"PGameChatNode-" + message.type}
				>
					<span
						style={{
							color: colorFromID(user == undefined || user.colorid == undefined ? -1 : user.colorid),
							fontWeight: 700,
						}}
					>
						{message.username}
					</span>
					: {message.message}
				</CText>
			</Box>
		);
	} else if (message.type == "joined" || message.type == "leaved") {
		return (
			<Box sx={PGameChatNodeStyle()} data-testid="PGameChatNode">
				<CText
					sx={{ color: appColors.greys[3] }}
					noTr={true}
					family={appTexts.text.secondaryFamily}
					fontWeight={600}
					size="md"
					testid={"PGameChatNode-" + message.type}
				>
					{ttrfn(
						message.type == "joined" ? "GAME_JOINED_MESSAGE" : "GAME_LEAVED_MESSAGE",
						{
							PLAYER: (
								<span
									style={{
										color: colorFromID(user == undefined || user.colorid == undefined ? -1 : user.colorid),
										fontWeight: 700,
									}}
								>
									{message.username}
								</span>
							),
						},
					)}
				</CText>
			</Box>
		);
	} else if (message.type == "guessed" && message.message) {
		return (
			<Box sx={PGameChatNodeStyle()} data-testid="PGameChatNode">
				<CText
					sx={{ color: appColors.greys[3] }}
					noTr={true}
					family={appTexts.text.secondaryFamily}
					fontWeight={600}
					size="md"
					testid={"PGameChatNode-" + message.type}
				>
					{ttrfn("GAME_GUESSED_MESSAGE", {
						PLAYER: (
							<span
								style={{
									color: colorFromID(user == undefined || user.colorid == undefined ? -1 : user.colorid),
									fontWeight: 700,
								}}
							>
								{message.username}
							</span>
						),
						GUESS: (
							<span style={{ color: appColors.cancel[1], fontWeight: 500 }}>
								{message.message}
							</span>
						),
					})}
				</CText>
			</Box>
		);
	} else if (message.type == "found") {
		return (
			<Box sx={PGameChatNodeStyle()} data-testid="PGameChatNode">
				<CText
					sx={{ color: appColors.validate[1] }}
					noTr={true}
					family={appTexts.text.secondaryFamily}
					fontWeight={600}
					size="md"
					testid={"PGameChatNode-" + message.type}
				>
					{ttrfn("GAME_FOUND_MESSAGE", {
						PLAYER: (
							<span
								style={{
									color: colorFromID(user == undefined || user.colorid == undefined ? -1 : user.colorid),
									fontWeight: 700,
								}}
							>
								{message.username}
							</span>
						),
					})}
				</CText>
			</Box>
		);
	}

	return <></>;
}

export default memo(PGameChatNode);
