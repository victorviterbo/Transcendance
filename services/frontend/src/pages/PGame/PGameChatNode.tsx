import { Box } from "@mui/material";
import { type IGameChatMsg } from "../../types/game";
import type { GPageProps } from "../common/GPageBases";
import CText from "../../components/text/CText";
import { colorFromID } from "../../utils/styles";
import { appColors, appTexts } from "../../styles/theme";
import { PGameChatNodeStyle } from "../../styles/pages/game/PGameChatStyle";
import { memo } from "react";
import { useLang } from "../../components/contexts/CLanguageProvider";

interface PGameChatNodeProps extends GPageProps {
	message: IGameChatMsg;
}

function PGameChatNode({ message }: PGameChatNodeProps) {
	const { ttrfn } = useLang();

	//====================== RETURS ======================
	if (message.type == "message" && message.body) {
		return (
			<Box sx={PGameChatNodeStyle()} data-testid="PGameChatNode">
				<CText
					sx={{ wordBreak: "break-word" }}
					noTr={true}
					family={appTexts.text.secondaryFamily}
					fontWeight={600}
					size="md"
					testid={"PGameChatNode-" + message.type}
				>
					<span
						style={{
							color: colorFromID(message.colorID == undefined ? -1 : message.colorID),
							fontWeight: 700,
						}}
					>
						{message.sender.username}
					</span>
					: {message.body}
				</CText>
			</Box>
		);
	} else if (message.type == "joined" || message.type == "leaved") {
		return (
			<Box sx={PGameChatNodeStyle()} data-testid="PGameChatNode">
				<CText
					sx={{ color: appColors.greys[3], wordBreak: "break-word" }}
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
										color: colorFromID(
											message.colorID == undefined ? -1 : message.colorID,
										),
										fontWeight: 700,
									}}
								>
									{message.sender.username}
								</span>
							),
						},
					)}
				</CText>
			</Box>
		);
	} else if (message.type == "guessed") {
		return (
			<Box sx={PGameChatNodeStyle()} data-testid="PGameChatNode">
				<CText
					sx={{ color: appColors.greys[3], wordBreak: "break-word" }}
					noTr={true}
					family={appTexts.text.secondaryFamily}
					fontWeight={600}
					size="md"
					testid={"PGameChatNode-" + message.type}
					color={message.body ? undefined : appColors.cancel[1]}
				>
					{ttrfn(message.body ? "GAME_GUESSED_MESSAGE" : "GAME_GUESSED_MESSAGE_EMPTY", {
						PLAYER: (
							<span
								style={{
									color: colorFromID(
										message.colorID == undefined ? -1 : message.colorID,
									),
									fontWeight: 700,
								}}
							>
								{message.sender.username}
							</span>
						),
						GUESS: (
							<span style={{ color: appColors.cancel[1], fontWeight: 500 }}>
								{message.body}
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
					sx={{ color: appColors.validate[1], wordBreak: "break-word" }}
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
									color: colorFromID(
										message.colorID == undefined ? -1 : message.colorID,
									),
									fontWeight: 700,
								}}
							>
								{message.sender.username}
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
