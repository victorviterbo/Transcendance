import { Box, Stack } from "@mui/material";
import CText from "../../../components/text/CText";
import CTextField from "../../../components/inputs/textFields/CTextField";
import CSlider from "../../../components/inputs/slider/CSlider";
import type { GPageProps } from "../../common/GPageBases";
import type { IGameSettings, TGameScope, TScoreOption } from "../../../types/game";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import CButtonToggle from "../../../components/inputs/buttons/CButtonToggle";
import CToggle from "../../../components/inputs/toggle/CToggle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CButton from "../../../components/inputs/buttons/CButton";
import { appColors, appSharedStyle, appTexts } from "../../../styles/theme";
import {
	PGameSettingsCodeBlockStyle,
	PGameSettingsCopyStyle,
	PGameSettingsSplitter,
	PGameSettingsTagButtonStyle,
	PGameSettingsTagListStyle,
} from "../../../styles/pages/game/PGameSettingsStyle";
import { gameThemeCount } from "../../../handlers/gameHandlers";
import { ttr, ttrfn } from "../../../localization/localization";
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
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";

interface PGameSettingsProps extends GPageProps {
	settings: IGameSettings;
	onSettingsChanged: (newSettings: IGameSettings) => void;
	onReturnToLobby: () => void;
}

function PGameSettings({ settings, onSettingsChanged, onReturnToLobby }: PGameSettingsProps) {
	//====================== STATS ======================
	const [tags, setTags] = useState<Record<string, boolean>>(structuredClone(settings.tags));
	const [searchFilter, setSearchFilter] = useState<string>("");

	const [nbSongs, setNBSongs] = useState<number>(settings.nbMusic);
	const [timer, setTimer] = useState<number>(settings.timer);
	const [breakTimer, setBreakTimer] = useState<number>(settings.breakTimer);

	const [seeOthers, setSeeOthers] = useState<boolean>(settings.seeOthers);
	const [fuzzy, setFuzzy] = useState<boolean>(settings.fuzzy);
	const [speedMode, setSpeedMode] = useState<TScoreOption>(settings.scoreOption);

	const [visibilityValue, setVisibilityValue] = useState<TGameScope>("private");
	const [codeVisible, setCodeVisible] = useState<boolean>(false);

	const [copied, setCopied] = useState<boolean>(false);
	const lastCallBack: React.RefObject<number> = useRef(-1);

	//====================== HANDLERS ======================
	const handleSaveChanges = () => {
		const nSettings: IGameSettings = {
			tags: tags,
			nbMusic: nbSongs,
			timer: timer,
			breakTimer: breakTimer,
			seeOthers: seeOthers,
			fuzzy: fuzzy,
			scoreOption: speedMode,
			scope: visibilityValue,
			code: settings.code,
		};
		onSettingsChanged(nSettings);
	};

	const handleOnReturn = () => {
		handleSaveChanges();
		onReturnToLobby();
	};

	//====================== STRUCTURE ======================
	const tagList: ReactNode | ReactNode[] = useMemo(() => {
		return Object.keys(tags).map((key: string) => {
			if (!ttr(key).toLocaleLowerCase().includes(searchFilter.toLocaleLowerCase()))
				return undefined;
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
	}, [tags, setTags, searchFilter]);

	//====================== LOCAL COMPONENTS ======================
	const getSlider = (
		min: number,
		max: number,
		step: number,
		currentValue: number,
		label: string,
		signal: React.Dispatch<React.SetStateAction<number>>,
	): ReactNode => {
		return (
			<>
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
		);
	};

	const getToggle = (
		currentValue: boolean,
		label: string,
		signal: React.Dispatch<React.SetStateAction<boolean>>,
	): ReactNode => {
		return (
			<CButtonToggle
				sx={{ p: "5px", minWidth: "50px" }}
				value={label}
				selected={currentValue}
				onClick={() => {
					signal(!currentValue);
				}}
			>
				{currentValue && <DoneIcon fontSize="small" />}
				{!currentValue && <CloseIcon fontSize="small" />}
			</CButtonToggle>
		);
	};

	//====================== HANDLE COPY ======================
	const onCodeCopy = useCallback(() => {
		navigator.clipboard.writeText(settings.code);
		setCopied(true);
		if (lastCallBack.current != -1) clearInterval(lastCallBack.current);
		lastCallBack.current = setInterval(() => {
			setCopied(false);
		}, 2000);
	}, [settings.code, setCopied]);

	return (
		<Stack
			sx={{ position: "absolute", inset: "15px", overflowY: "auto", overflowX: "hidden" }}
			direction={"row"}
		>
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
					value={searchFilter}
					onChange={(event) => {
						setSearchFilter(event.target.value);
					}}
				></CTextField>
				<Stack sx={PGameSettingsTagListStyle}>{tagList}</Stack>
				<CButton sx={{ mt: "20px", mb: "5px", minHeight: "35px" }} onClick={handleOnReturn}>
					<CText size="xs">GAME_SETTINGS_BACK</CText>
				</CButton>
			</Stack>
			<Stack direction={"column"} sx={{ flex: 1, mr: "10px" }}>
				<CText size="lg" sx={{ mx: 0 }}>
					GAME_SETTINGS_GAME
				</CText>
				<Box sx={PGameSettingsSplitter}></Box>
				{getSlider(
					SETTINGS_NGSONGS_MIN,
					SETTINGS_NGSONGS_MAX,
					SETTINGS_NGSONGS_STEP,
					nbSongs,
					"GAME_SETTINGS_NB_MUSIC",
					setNBSongs,
				)}
				{getSlider(
					SETTINGS_SONG_DURATION_MIN,
					SETTINGS_SONG_DURATION_MAX,
					SETTINGS_SONG_DURATION_STEP,
					timer,
					"GAME_SETTINGS_MUSIC_TIMER",
					setTimer,
				)}
				{getSlider(
					SETTINGS_BREAK_DURATION_MIN,
					SETTINGS_BREAK_DURATION_MAX,
					SETTINGS_BREAK_DURATION_STEP,
					breakTimer,
					"GAME_SETTINGS_BREAK_TIMER",
					setBreakTimer,
				)}

				<Stack
					direction={"row"}
					sx={{ alignItems: "stretch", minHeight: "150px", mt: "30px" }}
				>
					<Stack direction={"column"} sx={{ justifyContent: "space-between", mt: "4px" }}>
						<CText>GAME_SETTINGS_SEE_OTHERS</CText>
						<CText>GAME_SETTINGS_FUZZY</CText>
						<CText>GAME_SETTINGS_SCORE_OPTION</CText>
					</Stack>
					<Stack
						direction={"column"}
						sx={{ justifyContent: "space-between", ml: "20px" }}
					>
						{getToggle(seeOthers, "GAME_SETTINGS_SEE_OTHERS", setSeeOthers)}
						{getToggle(fuzzy, "GAME_SETTINGS_FUZZY", setFuzzy)}
						<CToggle
							fontSize="xs"
							padding="7px"
							value={speedMode}
							onValueChanged={(value: string) => {
								setSpeedMode(value as TScoreOption);
							}}
							options={[
								{ value: "speed", label: "GAME_SETTINGS_SCORE_OPTION_SPEED" },
								{ value: "normal", label: "GAME_SETTINGS_SCORE_OPTION_NORMAL" },
								{ value: "arma", label: "GAME_SETTINGS_SCORE_OPTION_ARMA" },
							]}
						></CToggle>
					</Stack>
				</Stack>

				<CText size="lg" sx={{ mx: 0, mt: "50px" }}>
					GAME_SETTINGS_VISIBILITY
				</CText>
				<Box sx={PGameSettingsSplitter}></Box>
				<Stack
					direction={"row"}
					sx={{ alignItems: "flex-start", justifyContent: "flex-start" }}
				>
					<CToggle
						fontSize={"sm"}
						padding="7px"
						value={visibilityValue}
						onValueChanged={(value: string) => {
							setVisibilityValue(value as TGameScope);
						}}
						options={[
							{ value: "private", label: "PRIVATE" },
							{ value: "public", label: "PUBLIC" },
						]}
					></CToggle>
					<Stack direction={"column"} sx={PGameSettingsCodeBlockStyle}>
						<Stack direction={"row"} sx={{ mb: "20px", alignItems: "center" }}>
							<CText sx={{ transform: "translateY(5px)" }}>GAME_SETTINGS_CODE</CText>
							<CText
								sx={{
									mx: "15px",
									transform: "translateY(2px)",
									filter: codeVisible ? undefined : "blur(7px)",
								}}
							>
								{settings.code}
							</CText>
							<CButtonToggle
								sx={{ p: "6px", minWidth: "50px" }}
								selected={codeVisible}
								value={"code_vidible"}
								onClick={() => {
									setCodeVisible(!codeVisible);
								}}
							>
								<VisibilityIcon fontSize="small" />
							</CButtonToggle>
						</Stack>
						<CButton onClick={onCodeCopy}>
							<CText size="sm" sx={PGameSettingsCopyStyle(!copied, false)}>
								GAME_SETTINGS_CB
							</CText>
							<CText size="sm" sx={PGameSettingsCopyStyle(copied, true)}>
								GAME_SETTINGS_CB_COPIED
							</CText>
						</CButton>
					</Stack>
				</Stack>

				<Box sx={{ flex: 1 }}></Box>
			</Stack>
		</Stack>
	);
}

export default PGameSettings;
