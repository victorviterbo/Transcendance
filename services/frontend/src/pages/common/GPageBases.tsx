import { useState, type ReactNode } from "react";
import type { GProps } from "../../components/common/GProps";
import { Box, Stack, Typography } from "@mui/material";
import GBackground from "./GBackground";
import CNavbar from "../../components/navigation/CNavbar";
import { appAnimation, appPositions } from "../../styles/theme";
import CDrawer from "../../components/navigation/CDrawer";
import { useAuth } from "../../components/auth/CAuthProvider";
import { sizeMakeString } from "../../utils/styles";
import CFooter from "../../components/navigation/CFooter";

export interface GPageProps extends GProps {
	children?: ReactNode;
}

function GPageBase({ children }: GPageProps) {
	const { status } = useAuth();
	const [friendOpen, setFriendOpen] = useState<boolean>(false);

	const handleOpenFriend = () => {
		setFriendOpen(!friendOpen);
	};

	return (
		<>
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
						<CFooter />
					</Stack>
					<CDrawer width="15%" top={appPositions.sizes.header} open={friendOpen}>
						<Stack>
							<Typography>HELLO</Typography>
							<Typography>HELLO</Typography>
							<Typography>HELLO</Typography>
							<Typography>HELLO</Typography>
							<Typography>HELLO</Typography>
						</Stack>
					</CDrawer>
				</Stack>
			</Box>
		</>
	);
}
export default GPageBase;
