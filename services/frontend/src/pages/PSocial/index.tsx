import { useEffect, useMemo, useState, type ReactNode } from "react";
import PFriendAdd from "./PFriendAdd";
import PFriendList from "./PFriendList";
import PFriendReq from "./PFriendReq";
import type { IFriendInfo } from "../../types/socials";
import { Box, Slide, Stack, useMediaQuery, useTheme } from "@mui/material";
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
import PeopleIcon from "@mui/icons-material/People";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";

interface PSocialProps extends GPageProps {
	activeTab: number;
	onTabChanged: (Value: number) => void;
	open: boolean;
}

function PSocial({ onTabChanged, activeTab, open }: PSocialProps) {
	const [messaging, setMessaging] = useState<IFriendInfo | undefined>(undefined);

	const theme = useTheme();
	const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
	const isTiny = useMediaQuery(theme.breakpoints.down("tn"));

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
							sx={{
								height: { xs: "25px", tn: "35px" },
								width: { xs: "25px", tn: "35px" },
								mr: { xs: "5px", tn: "10px" },
							}}
							src={messaging.avatar}
							alt={messaging.username}
						></CAvatar>
						<CUserProfileLink username={messaging.username}>
							<CText
								noTr={true}
								size={isTiny ? "md" : "lg"}
								textAlign="center"
								sx={{ mb: 0 }}
							>
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
	}, [messaging, isTiny]);

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
			contentPadding={isTiny ? 1 : isSmall ? 2 : undefined}
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
						overflow: { xs: "auto", tn: "hidden" },
					}}
				>
					<CCtrlTabs
						tabs={
							!isTiny
								? ["FRIEND_LISTS", "FRIENDS_ADD", "FRIEND_REQUESTS"]
								: [
										<PeopleIcon key="people" />,
										<PersonAddIcon key="add" />,
										<AccessTimeFilledIcon key="requests" />,
									]
						}
						testid="PSocialTab"
						activeTab={activeTab}
						onTabChanged={onTabChanged}
						size={isSmall ? "xs" : "sm"}
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
