import { Box } from "@mui/material";
import { SBGBox, SBGBaseColor } from "../../styles/bg/GBackgroundStyle";
const bgPolar = "imgs/shared/BGPolarMask.png";
const bgIcons = "imgs/shared/BG_Icons.png";

function GBackground() {

	const windmill: boolean = true;
	const windmillBg: boolean = true;
	const bg: boolean = true;


	//STRUCTURE
	return (
		<Box
			sx={SBGBox}
		>
			<Box
				sx={SBGBaseColor}
			></Box>
			{
				bg && <Box
				sx={{
					position: "absolute",

					height: "100%",
					width: "100%",
					zIndex: 0,

					backgroundColor: "#3d0d8a",
					maskImage: `url("${bgIcons}")`,
					maskSize: "50%",
					maskPosition: "center",

					WebkitMaskImage: `url("${bgIcons}")`,
					WebkitMaskSize: "50%",
					WebkitMaskPosition: "center",

					filter: "drop-shadow(20px 20px 20px #000000)",
				}}
				></Box>
			}
			{
			 windmill && <Box
				sx={{
					position: "absolute",
					inset: 0,
					filter: "drop-shadow(20px 20px 12px rgba(0,0,0,0.8))",
				}}
			>
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						backgroundColor: "#5656f5",
						WebkitMaskImage: `url(${bgPolar})`,
						WebkitMaskRepeat: "no-repeat",
						WebkitMaskSize: "100% 100%",
						WebkitMaskPosition: "center",
					}}
				>
					{ windmillBg && 
						<Box
							sx={{
								position: "absolute",

								height: "100%",
								width: "100%",
								zIndex: 0,

								backgroundColor: "#1d19e6",
								maskImage: `url("${bgIcons}")`,
								maskSize: "50%",
								maskPosition: "center",

								WebkitMaskImage: `url("${bgIcons}")`,
								WebkitMaskSize: "50%",
								WebkitMaskPosition: "center",

								filter: "drop-shadow(20px 20px 20px #000000)",
							}}
						></Box>
					}
				</Box>
			</Box>
			}
		</Box>
	);
}

export default GBackground;
