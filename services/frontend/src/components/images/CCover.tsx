import { useEffect, useMemo, useState } from "react";
import type { GCompProps } from "../common/GProps";
import { appColors, appSharedStyle } from "../../styles/theme";
import { alpha, Box } from "@mui/material";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { getScaledRadius } from "../../utils/styles";

interface CCoverProps extends GCompProps {
	url?: string;
	alt?: string;

	height?: number | string;
	width?: number | string;

	grey?: boolean;
}

function CCover({ url, alt, width, height, grey }: CCoverProps) {
	const [loaded, setLoaded] = useState<boolean>(false);

	const fallback = useMemo(() => {
		return (
			<Box
				sx={{
					width: width == undefined ? 56 : width,
					height: height == undefined ? 56 : height,
					flexShrink: 0,
					position: "relative",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					overflow: "hidden",
					borderRadius: getScaledRadius(appSharedStyle.radius, 2),
					background: `linear-gradient(135deg, ${alpha(
						grey ? appColors.greys[3] : appColors.primary[0],
						1,
					)} 0%, ${alpha(grey ? appColors.greys[6] : appColors.tertiary[0], 1)} 100%)`,
					color: grey ? appColors.secondary[0] : appColors.white,
				}}
			>
				<Box
					sx={{
						position: "absolute",
						inset: 8,
						borderRadius: "999px",
						border: `2px solid ${alpha(grey ? appColors.secondary[0] : appColors.white, 0.38)}`,
					}}
				/>
				<Box
					sx={{
						position: "absolute",
						inset: 18,
						borderRadius: "999px",
						border: `2px solid ${alpha(grey ? appColors.secondary[0] : appColors.white, 0.28)}`,
					}}
				/>
				<MusicNoteIcon sx={{ position: "relative", zIndex: 1 }} />
			</Box>
		);
	}, [grey, width, height]);

	useEffect(() => {
		async function reload() {
			setLoaded(false);
			if (url) {
				const img = new Image();
				img.onload = () => {
					setLoaded(true);
				};
				img.src = url;
			}
		}
		reload();
	}, [url, setLoaded]);

	if (!loaded) return fallback;
	return (
		<Box
			component="img"
			src={url}
			alt={alt}
			onError={() => setLoaded(false)}
			sx={(theme) => ({
				width: width == undefined ? 56 : width,
				height: height == undefined ? 56 : height,
				flexShrink: 0,
				objectFit: "cover",
				borderRadius: getScaledRadius(theme.shape.borderRadius, 2),
				backgroundColor: alpha(theme.palette.primary.main, 0.08),
			})}
		/>
	);
}

export default CCover;
