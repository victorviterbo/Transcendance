import { useState, type ReactNode } from "react";
import type { GProps } from "../../components/common/GProps";
import { Box, Stack } from "@mui/material";
import GBackground from "./GBackground";
import CNavbar from "../../components/navigation/CNavbar";
import { appAnimation, appPositions } from "../../styles/theme";
import CDrawer from "../../components/navigation/CDrawer";
import { useAuth } from "../../components/auth/CAuthProvider";
import { cssAddSizes, sizeMakeString } from "../../utils/styles";
import PSocial from "../PSocial";

export interface GPageProps extends GProps {
	children?: ReactNode;
}

function GPageBase({ children }: GPageProps) {
	const { status } = useAuth();
	const [friendOpen, setFriendOpen] = useState<boolean>(true);

	const handleOpenFriend = () => {
		setFriendOpen(!friendOpen);
	};

	return (
		<>
			<Box sx={{ position: "fixed", width: "100%", height: "100%" }}>
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
					<CNavbar onOpenFiend={handleOpenFriend} />
					<Stack sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
						<Box
							sx={(Theme) => ({
								transition: Theme.transitions.create(["width"], {
									easing: appAnimation.easing.easeOut,
									duration: appAnimation.timing.enteringScreen,
								}),
								flex: 1,
								width: friendOpen
									? "calc( 100% - " +
										sizeMakeString(appPositions.sizes.friends) +
										")"
									: "100%",
							})}
						>
							{children}
						</Box>
						<Box
							sx={{
								flexShrink: 0,
								height:
									appPositions.sizes.footer +
									(appPositions.sizes.footer == "string" ? "" : "px"),
								bgcolor: "primary.main",
							}}
						></Box>
					</Stack>
					{status && (
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
						>
							<PSocial></PSocial>
						</CDrawer>
					)}
				</Stack>
			</Box>
		</>
	);
}
export default GPageBase;
