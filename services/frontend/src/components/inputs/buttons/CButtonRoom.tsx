import { Box, Stack } from "@mui/material";
import type { IRoomInfo } from "../../../types/room";
import type { CButtonProps } from "./CButton";
import CButton from "./CButton";
import CText from "../../text/CText";
import CTitle from "../../text/CTitle";

interface CButtonRoomProps extends CButtonProps {
	infos: IRoomInfo;
}

function CButtonRoom({ infos, ...other }: CButtonRoomProps) {
	const roomBackground = `linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(12, 9, 42, 0.04) 28%, rgba(12, 9, 42, 0.92) 100%), url(${infos.img})`;

	return (
		<CButton
			sx={{
				width: "100%",
				minHeight: {
					xs: 210,
					sm: 230,
				},
				p: 0,
				alignItems: "stretch",
				justifyContent: "flex-end",
				background: roomBackground,
				backgroundSize: "cover",
				backgroundPosition: "center",
				boxShadow: "0 10px 0 rgba(23, 15, 56, 0.28), 0 18px 26px rgba(23, 15, 56, 0.16)",
				"&::before": {
					content: '""',
					position: "absolute",
					inset: 0,
					background:
						"linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0) 30%, rgba(12, 9, 42, 0.8) 100%)",
					opacity: 1,
				},
				"&:hover": {
					background: roomBackground,
					transform: "translateY(3px) scale(1.01)",
					boxShadow: "0 5px 0 rgba(23, 15, 56, 0.28), 0 12px 18px rgba(23, 15, 56, 0.14)",
				},
			}}
			{...other}
			data-testid={"CButtonRoom"}
		>
			<Stack
				sx={{
					position: "relative",
					zIndex: 1,
					mt: "auto",
					width: "100%",
					alignItems: "flex-start",
					gap: 1.25,
					p: 2.5,
				}}
			>
				<Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
					<Box
						sx={{
							px: 1.5,
							py: 0.75,
							borderRadius: "999px",
							backgroundColor: "rgba(255, 216, 74, 0.94)",
							color: "rgba(23, 15, 56, 0.96)",
							fontFamily: "DynaPuff, sans-serif",
							fontSize: "0.78rem",
							fontWeight: 700,
							letterSpacing: "0.04em",
						}}
					>
						{infos.theme}
					</Box>
					<Box
						sx={{
							px: 1.5,
							py: 0.75,
							borderRadius: "999px",
							backgroundColor: "rgba(255, 255, 255, 0.16)",
							color: "rgba(255, 255, 255, 0.96)",
							border: "2px solid rgba(255, 255, 255, 0.34)",
							fontFamily: "DynaPuff, sans-serif",
						}}
					>
						<CText size="sm" sx={{ fontWeight: 700, letterSpacing: "0.04em" }}>
							{infos.playerCount + " / " + infos.playerMax}
						</CText>
					</Box>
				</Stack>
				<CTitle size="sm" sx={{ fontSize: "1.3rem", color: "common.white" }}>
					{infos.name}
				</CTitle>
				<CText size="sm" sx={{ color: "rgba(255, 255, 255, 0.82)", lineHeight: 1.45 }}>
					Join the playlist rush and see who keeps their streak alive.
				</CText>
			</Stack>
		</CButton>
	);
}

export default CButtonRoom;
