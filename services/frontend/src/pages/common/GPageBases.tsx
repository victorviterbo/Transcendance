import { useState, type ReactNode } from "react";
import type { GProps } from "../../components/common/GProps";
import { Box, Stack, useMediaQuery } from "@mui/material";
import GBackground from "./GBackground";
import CNavbar from "../../components/navigation/CNavbar";
import { appAnimation, appPositions } from "../../styles/theme";
import CDrawer from "../../components/navigation/CDrawer";
import { useAuth } from "../../components/auth/CAuthProvider";
import CFooter from "../../components/navigation/CFooter";
import { cssAddSizes, sizeMakeString } from "../../utils/styles";
import PSocial from "../PSocial";
import PNotif from "../PNotif";
import CWebsocket from "../../components/websocket/CWebsocket";

export interface GPageProps extends GProps {
	children?: ReactNode;
	inGame?: boolean;
}

const EScoialView: Record<string, number> = {
	LIST: 0,
	ADD: 1,
	REQUESTS: 2,
};

function GPageBase({ inGame, children }: GPageProps) {
	const { user, status } = useAuth();
	const [friendOpen, setFriendOpen] = useState<boolean>(false);
	// 0: friendList, 1: addFriends, 2: friendRequests
	const [friendTab, setFriendTab] = useState<number>(EScoialView.LIST);
	const [notifOpen, setNotifOpen] = useState<boolean>(false);
	const [notifCount, setNotifCount] = useState<number>(0);

	const breakpoint = useMediaQuery("(max-width:1600px)");
	const drawerOver: boolean = inGame || breakpoint ? true : false;

	const handleOpenFriend = () => {
		setFriendOpen(!friendOpen);
		setNotifOpen(false);
	};

	const handleOpenNotif = () => {
		setNotifOpen(!notifOpen);
		setFriendOpen(false);
	};

	const handleOpenFriendRequests = () => {
		setFriendOpen(true);
		setNotifOpen(false);
		setFriendTab(EScoialView.REQUESTS);
	};

	const handleOpenFriendList = () => {
		setFriendTab(EScoialView.ADD);
		setFriendOpen(true);
		setNotifOpen(false);
		setFriendTab(EScoialView.LIST);
	};

	function getBody() {
		return (
			<Box sx={{ position: "fixed", inset: 0 }}>
				<GBackground />
				<Stack
					sx={{
						position: "absolute",
						top: 0,
						left: 0,

						height: "100%",
						width: "100%",
						alignItems: "stretch",
					}}
				>
					<CNavbar
						onToggleFriend={handleOpenFriend}
						isFriendActive={friendOpen}
						onToggleNotif={handleOpenNotif}
						isNotifActive={notifOpen}
						notifCount={notifCount}
					/>
					<Stack sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
						<Box
							sx={(Theme) => ({
								transition: Theme.transitions.create(["width"], {
									easing: appAnimation.easing.easeOut,
									duration: appAnimation.timing.enteringScreen,
								}),
								flex: 1,
								position: "relative",
								width:
									(friendOpen || notifOpen) && !drawerOver
										? "calc( 100% - " +
											(typeof appPositions.sizes.friends == "object"
												? appPositions.sizes.friends.xl
												: sizeMakeString(appPositions.sizes.friends)) +
											")"
										: "100%",
								overflow: "auto",
							})}
						>
							{children}
						</Box>
						<CFooter hide={inGame ? true : false} />
					</Stack>
					{user && (
						<CDrawer
							width={appPositions.sizes.friends}
							margin={{
								top: cssAddSizes(
									appPositions.sizes.header,
									appPositions.socialMargin?.top,
								),
								right: appPositions.socialMargin?.right,
								bottom: appPositions.socialMargin?.bottom,
								left: appPositions.socialMargin?.left,
							}}
							open={friendOpen}
							data-testid="PSocialDrawer"
							over={drawerOver}
							onClose={() => {
								setFriendOpen(false);
							}}
						>
							<PSocial
								activeTab={friendTab}
								onTabChanged={(value: number) => {
									setFriendTab(value);
								}}
								open={friendOpen}
							></PSocial>
						</CDrawer>
					)}
					{user && (
						<CDrawer
							width={appPositions.sizes.friends}
							margin={{
								top: cssAddSizes(
									appPositions.sizes.header,
									appPositions.socialMargin?.top,
								),
								right: appPositions.socialMargin?.right,
								bottom: appPositions.socialMargin?.bottom,
								left: appPositions.socialMargin?.left,
							}}
							open={notifOpen}
							data-testid="PNotifDrawer"
							over={drawerOver}
							onClose={() => {
								setNotifOpen(false);
							}}
						>
							<PNotif
								isOpen={notifOpen}
								onSeeFriendsReq={handleOpenFriendRequests}
								onSeeFriends={handleOpenFriendList}
								onNotifCount={(value: number) => {
									setNotifCount(value);
								}}
							></PNotif>
						</CDrawer>
					)}
				</Stack>
			</Box>
		);
	}

	if (status == "loading") return <></>;

	return <CWebsocket key={status}>{getBody()}</CWebsocket>;
}
export default GPageBase;
