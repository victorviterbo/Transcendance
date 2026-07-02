import { useEffect, useMemo, useState, type ReactNode } from "react";
import PFriendAdd from "./PFriendAdd";
import PFriendList from "./PFriendList";
import PFriendReq from "./PFriendReq";
import type { IFriendInfo } from "../../types/socials";
import { Box, Slide, Stack } from "@mui/material";
import PFriendChat from "./PFriendChat";
import CTitleBasePaper from "../../components/surfaces/CTitleBasePaper";
import CText from "../../components/text/CText";
import { CTitlePaperTitleStyle } from "../../styles/components/surfaces/CTitlePaper";
import CAvatar from "../../components/images/CAvatar";
import CUserProfileLink from "../../components/navigation/CUserProfileLink";
import CIconButton from "../../components/inputs/buttons/CIconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import type { GPageProps } from "../common/GPageBases";
import CCtrlTabs from "../../components/navigation/CCtrlTabs";

interface PSocialProps extends GPageProps {
	activeTab: number;
	onTabChanged: (Value: number) => void;
	open: boolean;
}

function PSocial({ onTabChanged, activeTab, open }: PSocialProps) {
	const [messaging, setMessaging] = useState<IFriendInfo | undefined>(undefined);

	useEffect(() => {
		async function checkClosed() {
			if (!open) setMessaging(undefined);
		}
		checkClosed();
	}, [open, setMessaging]);

	const title: ReactNode | ReactNode[] = useMemo(() => {
		if (messaging) {
			return (
				<Box
					sx={[
						{ position: "relative", height: "40px" },
						...(Array.isArray(CTitlePaperTitleStyle)
							? CTitlePaperTitleStyle
							: CTitlePaperTitleStyle
								? [CTitlePaperTitleStyle]
								: []),
					]}
				>
					<Stack
						direction="row"
						sx={{
							position: "absolute",
							inset: 0,
							alignItems: "center",
							justifyContent: "center",
							flex: 1,
						}}
					>
						<CAvatar
							profileUsername={messaging.username}
							sx={{ height: "35px", width: "35px", mr: "10px" }}
							src={messaging.avatar}
							alt={messaging.username + "'s picture"}
						></CAvatar>
						<CUserProfileLink username={messaging.username}>
							<CText noTr={true} size={"lg"} textAlign="center" sx={{ mb: 0 }}>
								{messaging.username}
							</CText>
						</CUserProfileLink>
					</Stack>
					<Stack
						direction="row"
						sx={{
							position: "absolute",
							inset: 0,
							alignItems: "center",
							justifyContent: "left",
							flex: 1,
						}}
					>
						<CIconButton
							sx={{ height: "30px" }}
							onClick={() => {
								setMessaging(undefined);
							}}
							data-testid="PSocialCloseChat"
						>
							<ArrowBackIcon fontSize="small" />
						</CIconButton>
					</Stack>
				</Box>
			);
		}
		return (
			<Box
				sx={[
					{ position: "relative", height: "40px" },
					...(Array.isArray(CTitlePaperTitleStyle)
						? CTitlePaperTitleStyle
						: CTitlePaperTitleStyle
							? [CTitlePaperTitleStyle]
							: []),
				]}
			>
				<Stack
					direction="row"
					sx={{
						position: "absolute",
						inset: 0,
						alignItems: "center",
						justifyContent: "center",
						flex: 1,
					}}
				>
					<CText size={"lg"} textAlign="center">
						FRIEND_TITLE
					</CText>
				</Stack>
			</Box>
		);
	}, [messaging]);

	return (
		<CTitleBasePaper
			overflow="hidden"
			contentFlex={1}
			isFlex={true}
			position="relative"
			sx={{
				display: "flex",
				flexDirection: "column",
				flex: 1,
				marginBottom: "20px",
				minHeight: 0,
				overflow: "hidden",
			}}
			titleNode={title}
			data-testid="PSocial"
		>
			<Slide direction="right" in={messaging ? false : true}>
				<Box
					sx={{
						position: "absolute",
						padding: "inherit",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						flex: 1,
						overflow: "hidden",
					}}
				>
					<CCtrlTabs
						tabs={["FRIEND_LISTS", "FRIENDS_ADD", "FRIEND_REQUESTS"]}
						testid="PSocialTab"
						activeTab={activeTab}
						onTabChanged={onTabChanged}
					>
						<PFriendList
							onMessaging={(Friend: IFriendInfo) => {
								setMessaging(Friend);
							}}
							open={open}
						></PFriendList>
						<PFriendAdd></PFriendAdd>
						<PFriendReq open={open}></PFriendReq>
					</CCtrlTabs>
				</Box>
			</Slide>
			<Slide direction="left" in={messaging ? true : false}>
				<Box
					sx={{
						position: "absolute",
						padding: "inherit",
						inset: 0,
						display: "flex",
						flexDirection: "column",
						flex: 1,
						overflow: "hidden",
					}}
				>
					<PFriendChat targetFriend={messaging}></PFriendChat>
				</Box>
			</Slide>
		</CTitleBasePaper>
	);
}

export default PSocial;
