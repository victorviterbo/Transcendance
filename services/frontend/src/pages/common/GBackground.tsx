import { Box } from "@mui/material";
import {
	SBGBox,
	SBGBaseColor,
	SBGIconMask,
	SBGWindmillBox,
	SBGWindmillMask,
	SBGIconTextureBox,
} from "../../styles/bg/GBackgroundStyle";
import { appBG } from "../../styles/theme";
import type { GCompProps } from "../../components/common/GProps";

interface GBackgroundIconsProps extends GCompProps {
	isWindmill?: boolean;
}

function GBackgroundIcons({ isWindmill }: GBackgroundIconsProps) {
	return (
		<Box sx={SBGIconTextureBox}>
			<Box sx={SBGIconMask(isWindmill)}></Box>
		</Box>
	);
}

function GBackgroundWindmill() {
	return (
		<Box sx={SBGWindmillBox}>
			<Box sx={SBGWindmillMask}>
				{appBG.windmillBG && <GBackgroundIcons isWindmill={true} />}
			</Box>
		</Box>
	);
}

function GBackground() {
	//STRUCTURE
	return (
		<Box sx={SBGBox}>
			<Box sx={SBGBaseColor}></Box>
			{appBG.iconBG && <GBackgroundIcons />}
			{appBG.windmill && <GBackgroundWindmill />}
		</Box>
	);
}

export default GBackground;
