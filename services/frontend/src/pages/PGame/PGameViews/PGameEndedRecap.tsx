import { cloneElement, useMemo, type ReactElement } from "react";
import type { GCompProps } from "../../../components/common/GProps";
import { Box, Stack, useMediaQuery, useTheme, type SvgIconProps } from "@mui/material";
import CText from "../../../components/text/CText";
import {
	PGameEndedRecapStyle,
	type IGameEndedRecapStyle,
} from "../../../styles/pages/game/PGameRoundStyle";
import { GAME_ENDED_MAX } from "../../../constants";

export type TDataInfo = {
	avr: number;
	best: number;
	total?: number;
	lead?: number;
	worst?: number;
};

interface PGameEndedRecapProsp extends GCompProps {
	node: ReactElement<SvgIconProps>;
	info: TDataInfo;
}

function PGameEndedRecap({ node, info }: PGameEndedRecapProsp) {
	const style: IGameEndedRecapStyle = useMemo(() => {
		return PGameEndedRecapStyle();
	}, []);

	const theme = useTheme();
	const isMedium = useMediaQuery(theme.breakpoints.down("md"));
	const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

	const icon = useMemo(() => {
		return cloneElement(node, {
			fontSize: isSmall ? "small" : "large",
			sx: style.icon,
		});
	}, [node, style, isSmall]);

	return (
		<Box sx={style.card}>
			<Stack sx={{ alignItems: "stretch" }} direction={{ xs: "row", sm: "column" }}>
				<Stack sx={{ alignItems: "center" }} direction={"column"}>
					<Stack sx={style.iconBox} direction={"column"}>
						{icon}
					</Stack>
				</Stack>
				<Stack direction={"row"} sx={{ flex: 1 }}>
					<Stack direction={"column"} sx={style.dataStack}>
						<CText size={isMedium ? "sm" : "md"} sx={style.valueText}>
							{info.avr == GAME_ENDED_MAX ? "--" : info.avr}
						</CText>
						<CText size={isMedium ? "3xs" : "2xs"}>GAME_ENDED_AVR</CText>
					</Stack>
					<Box sx={style.split}></Box>
					<Stack direction={"column"} sx={style.dataStack}>
						<CText size={isMedium ? "sm" : "md"} sx={style.valueText}>
							{info.best == GAME_ENDED_MAX ? "--" : info.best}
						</CText>
						<CText size={isMedium ? "3xs" : "2xs"}>GAME_ENDED_BEST</CText>
					</Stack>
					<Box sx={style.split}></Box>
					{info.total != undefined && (
						<Stack direction={"column"} sx={style.dataStack}>
							<CText size={isMedium ? "sm" : "md"} sx={style.valueText}>
								{info.total}
							</CText>
							<CText size={isMedium ? "3xs" : "2xs"}>GAME_ENDED_TOTAL</CText>
						</Stack>
					)}
					{info.lead != undefined && (
						<Stack direction={"column"} sx={style.dataStack}>
							<CText size={isMedium ? "sm" : "md"} sx={style.valueText}>
								{info.lead}
							</CText>
							<CText size={isMedium ? "3xs" : "2xs"}>GAME_ENDED_LEAD</CText>
						</Stack>
					)}
					{info.worst != undefined && (
						<Stack direction={"column"} sx={style.dataStack}>
							<CText size={isMedium ? "sm" : "md"} sx={style.valueText}>
								{info.worst == 0 ? "--" : info.worst}
							</CText>
							<CText size={isMedium ? "3xs" : "2xs"}>GAME_ENDED_WORST</CText>
						</Stack>
					)}
				</Stack>
			</Stack>
		</Box>
	);
}

export default PGameEndedRecap;
