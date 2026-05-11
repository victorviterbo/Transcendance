import { Box, Stack } from "@mui/material";
import CText from "../../../components/text/CText";
import CTextField from "../../../components/inputs/textFields/CTextField";
import CSlider from "../../../components/inputs/slider/CSlider";
import type { GPageProps } from "../../common/GPageBases";
import type { IGameSettings } from "../../../types/game";
import { useMemo, useState, type ReactNode } from "react";
import CButtonToggle from "../../../components/inputs/buttons/CButtonToggle";
import CToggle from "../../../components/inputs/toggle/CToggle";
import CIconButton from "../../../components/inputs/buttons/CIconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CButton from "../../../components/inputs/buttons/CButton";
import { appColors, appSharedStyle, appTexts } from "../../../styles/theme";
import {
	PGameSettingsSplitter,
	PGameSettingsTagButtonStyle,
	PGameSettingsTagListStyle,
} from "../../../styles/pages/game/PGameSettingsStyle";
import { gameThemeCount } from "../../../handlers/gameHandlers";
import { ttrfn } from "../../../localization/localization";
import {
	SETTINGS_BREAK_DURATION_MAX,
	SETTINGS_BREAK_DURATION_MIN,
	SETTINGS_BREAK_DURATION_STEP,
	SETTINGS_NGSONGS_MAX,
	SETTINGS_NGSONGS_MIN,
	SETTINGS_NGSONGS_STEP,
	SETTINGS_SONG_DURATION_MAX,
	SETTINGS_SONG_DURATION_MIN,
	SETTINGS_SONG_DURATION_STEP,
} from "../../../constants";

interface PGameSettingsProps extends GPageProps {
	settings: IGameSettings;
	onSettingsChanged: (newSettings: IGameSettings) => void;
}

function PGameSettings({ settings, onSettingsChanged }: PGameSettingsProps) {
	//====================== STATS ======================
	const [tags, setTags] = useState<Record<string, boolean>>(structuredClone(settings.tags));
	const [nbSongs, setNBSongs] = useState<number>(settings.nbMusic);
	const [timer, setTimer] = useState<number>(settings.timer);
	const [breakTimer, setBreakTimer] = useState<number>(settings.breakTimer);

	//====================== STRUCTURE ======================
	const tagList: ReactNode | ReactNode[] = useMemo(() => {
		return Object.keys(tags).map((key: string) => {
			return (
				<CButtonToggle
					boxSx={{ mb: "10px" }}
					sx={PGameSettingsTagButtonStyle}
					value={key}
					selected={tags[key]}
					key={key}
					onClick={() => {
						const nTags = structuredClone(tags);
						if (gameThemeCount(nTags) <= 1 && nTags[key]) return;
						nTags[key] = !nTags[key];
						setTags(nTags);
					}}
				>
					<CText size="sm" sx={{ m: "0px" }}>
						{key}
					</CText>
				</CButtonToggle>
			);
		});
	}, [tags, setTags]);

	//====================== LOCAL COMPONENTS ======================
	const getSlider = (min: number, max: number, step: number, currentValue: number, label: string, signal: React.Dispatch<React.SetStateAction<number>>): ReactNode => {
		return <>
			<CText size="md">
				{ttrfn(label, {
					COUNT: <span style={{ color: appColors.primary[0] }}>{currentValue}</span>,
				})}
			</CText>
			<CSlider
				min={min}
				max={max}
				step={step}
				value={currentValue}
				marks
				onChange={(_: Event, value: number | number[]) => {
					if (Array.isArray(value) && value.length > 0) signal(value[0]);
					else if (typeof value == "number") signal(value);
				}}
			></CSlider>
		</>
	}

	return (
		<Stack sx={{ position: "absolute", inset: "15px" }} direction={"row"}>
			<Stack direction={"column"} sx={{ mr: "50px" }}>
				<CText size="lg" sx={{ my: 0, ml: "15px" }}>
					GAME_SETTINGS_PLAYLIST
				</CText>
				<CTextField
					sx={{ my: "5px" }}
					fontSize={appTexts.text.sizes.xs}
					borderWidth="2px"
					verticalPadding="10px"
					borderRadius={appSharedStyle.gameRadius}
				></CTextField>
				<Stack sx={PGameSettingsTagListStyle}>{tagList}</Stack>
			</Stack>
			<Stack direction={"column"} sx={{ flex: 1, mr: "10px"}}>
				<CText size="lg" sx={{ mx: 0 }}>
					GAME_SETTINGS_GAME
				</CText>
				<Box sx={PGameSettingsSplitter}></Box>
				{getSlider(SETTINGS_NGSONGS_MIN, SETTINGS_NGSONGS_MAX, SETTINGS_NGSONGS_STEP, nbSongs, "GAME_SETTINGS_NB_MUSIC", setNBSongs)}
				{getSlider(SETTINGS_SONG_DURATION_MIN, SETTINGS_SONG_DURATION_MAX, SETTINGS_SONG_DURATION_STEP, timer, "GAME_SETTINGS_MUSIC_TIMER", setTimer)}
				{getSlider(SETTINGS_BREAK_DURATION_MIN, SETTINGS_BREAK_DURATION_MAX, SETTINGS_BREAK_DURATION_STEP, breakTimer, "GAME_SETTINGS_BREAK_TIMER", setBreakTimer)}
				<Stack direction={"row"}>
					<CText>GAME_SETTINGS_SEE_OTHERS</CText>
					<CButtonToggle value={settings.seeOthers}></CButtonToggle>
				</Stack>
				<Stack direction={"row"}>
					<CText>GAME_SETTINGS_FUZZY</CText>
					<CButtonToggle value={settings.fuzzy}></CButtonToggle>
				</Stack>
				<Stack direction={"row"}>
					<CText>GAME_SETTINGS_SCORE_OPTION</CText>
					<CToggle
						options={[
							{ value: "speed", label: "GAME_SETTINGS_SCORE_OPTION_SPEED" },
							{ value: "normal", label: "GAME_SETTINGS_SCORE_OPTION_NORMAL" },
						]}
					></CToggle>
				</Stack>

				<Box sx={{ flex: 1 }}></Box>

				<CText size="lg" sx={{ mx: 0 }}>
					GAME_SETTINGS_VISIBILITY
				</CText>
				<Box sx={PGameSettingsSplitter}></Box>
				<Stack direction={"row"}>
					<CToggle
						options={[
							{ value: "private", label: "PRIVATE" },
							{ value: "public", label: "PUBLIC" },
						]}
					></CToggle>
					<Stack direction={"column"}>
						<Stack direction={"row"}>
							<CText>GAME_SETTINGS_CODE</CText>
							<CText>{settings.code}</CText>
							<CIconButton>
								<VisibilityIcon />
							</CIconButton>
						</Stack>
						<CButton>GAME_SETTINGS_CB</CButton>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
}

export default PGameSettings;
