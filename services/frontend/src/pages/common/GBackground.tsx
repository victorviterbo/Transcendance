import { Box } from "@mui/material";
import { appThemeDef } from "../../styles/theme";
const bgWood = "imgs/shared/bg_wood_2.png";

function GBackground() {
	return (
		<Box
			sx={{
				position: "fix",

				height: "100%",
				width: "100%",
				zIndex: -1,
			}}
		>
			<Box
				sx={{
					position: "absolute",

					height: "100%",
					width: "100%",
					zIndex: -1,

					backgroundImage: `url(${bgWood})`,
					backgroundSize: "10%",

					filter: `brightness(${appThemeDef.bg.brightness})`,
				}}
			></Box>
		</Box>
	);
}

export default GBackground;
