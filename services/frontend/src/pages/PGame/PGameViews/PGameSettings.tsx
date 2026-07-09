import { Box, Stack, useMediaQuery, useTheme } from "@mui/material";
import CText from "../../../components/text/CText";
import CTextField from "../../../components/inputs/textFields/CTextField";
import CSlider from "../../../components/inputs/slider/CSlider";
import type { GPageProps } from "../../common/GPageBases";
import type { IGameSettings, TScoreOption } from "../../../types/game";
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
import { GameInstance, gameThemeCount } from "../../../handlers/gameHandlers";
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
import { useLang } from "../../../components/contexts/CLanguageProvider";

interface PGameSettingsProps extends GPageProps {
	settings: IGameSettings;
	game: React.RefObject<GameInstance | undefined>;
	onReturnToLobby: () => void;
}

function PGameSettings({ settings, game, onReturnToLobby }: PGameSettingsProps) {
	//====================== STATS ======================
	const [tags, setTags] = useState<Record<string, boolean>>(
		!settings.tags ? {} : structuredClone(settings.tags),
	);
	const [searchFilter, setSearchFilter] = useState<string>("");

	const [nbSongs, setNBSongs] = useState<number>(settings.trackCount);
	const [timer, setTimer] = useState<number>(settings.playbackDuration);
	const [breakTimer, setBreakTimer] = useState<number>(settings.breakDuration);

	const [seeOthers, setSeeOthers] = useState<boolean>(settings.reveal);
	const [fuzzy, setFuzzy] = useState<boolean>(settings.fuzzy);
	const [speedMode, setSpeedMode] = useState<TScoreOption>(settings.mode);

	const [copied, setCopied] = useState<boolean>(false);
	const lastCallBack: React.RefObject<number> = useRef(-1);
	const [codeVisible, setCodeVisible] = useState<boolean>(false);

	const theme = useTheme();
	const mobile = useMediaQuery(theme.breakpoints.down("md"));

	const { ttr, ttrfn } = useLang();

	//====================== HANDLERS ======================
	const handleSaveChanges = useCallback(() => {
		const nSettings: IGameSettings = {
			tags: tags,
			genres: [],
			trackCount: nbSongs,
			playbackDuration: timer,
			breakDuration: breakTimer,
			reveal: seeOthers,
			fuzzy: fuzzy,
			mode: speedMode,
		};
		if (!game.current) return;
		game.current.settingsChanged(nSettings);
	}, [tags, nbSongs, timer, breakTimer, seeOthers, fuzzy, speedMode, game]);

	const handleOnReturn = () => {
		handleSaveChanges();
		onReturnToLobby();
	};

	//====================== EVENTS ======================

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
					data-testid="PGameSettings_Tag"
				>
					<CText size="sm" sx={{ m: "0px" }}>
						{key}
					</CText>
				</CButtonToggle>
			);
		});
	}, [tags, setTags, searchFilter, ttr]);

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
				<CText size="md" testid={"PGameSettings_SliderTitle_" + label}>
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
					sx={{ ml: { xs: "5%", md: "0%" }, width: { xs: "90%", md: "60%" } }}
					onChange={(_: Event, value: number | number[]) => {
						let finalValue: number = Array.isArray(value) ? value[0] : value;
						if (finalValue < min) finalValue = min;
						else if (finalValue > max) finalValue = max;
						else if (finalValue % step != 0) finalValue -= finalValue % step;
						signal(finalValue);
					}}
					testid={"PGameSettings_Slider_" + label}
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
				data-testid={"PGameSettings_Toggle_" + label}
			>
				{currentValue && <DoneIcon fontSize="small" />}
				{!currentValue && <CloseIcon fontSize="small" />}
			</CButtonToggle>
		);
	};

	//====================== HANDLE COPY ======================
	const onCodeCopy = useCallback(() => {
		navigator.clipboard.writeText(game.current ? game.current.uid : "");
		setCopied(true);
		if (lastCallBack.current != -1) clearInterval(lastCallBack.current);
		lastCallBack.current = setInterval(() => {
			setCopied(false);
		}, 2000);
	}, [game]);

	//====================== MEMOS ======================
	const toggles = useMemo(() => {
		return (
			<Stack
				direction={"column"}
				spacing={2}
				sx={{
					alignItems: "stretch",
					minHeight: "150px",
					flexShrink: 0,
					mt: "30px",
					mr: "15px",
				}}
			>
				<Stack
					direction={"row"}
					justifyContent={"space-between"}
					alignItems={"center"}
					sx={{ flexWrap: "wrap" }}
				>
					<CText>GAME_SETTINGS_SEE_OTHERS</CText>
					{getToggle(seeOthers, "GAME_SETTINGS_SEE_OTHERS", setSeeOthers)}
				</Stack>
				<Stack
					direction={"row"}
					justifyContent={"space-between"}
					alignItems={"center"}
					sx={{ flexWrap: "wrap" }}
				>
					<CText>GAME_SETTINGS_FUZZY</CText>
					{getToggle(fuzzy, "GAME_SETTINGS_FUZZY", setFuzzy)}
				</Stack>
				<Stack
					direction={"row"}
					justifyContent={"space-between"}
					alignItems={"center"}
					sx={{ flexWrap: "wrap" }}
				>
					<CText>GAME_SETTINGS_SCORE_OPTION</CText>
					<CToggle
						fontSize="xs"
						padding="7px"
						value={speedMode}
						allowUnselect={false}
						onValueChanged={(value: string) => {
							setSpeedMode(value as TScoreOption);
						}}
						options={[
							{ value: "speed", label: "GAME_SETTINGS_SCORE_OPTION_SPEED" },
							{ value: "normal", label: "GAME_SETTINGS_SCORE_OPTION_NORMAL" },
						]}
						data-testid={"PGameSettings_ScoreOption"}
					></CToggle>
				</Stack>
			</Stack>
		);
	}, [speedMode, fuzzy, seeOthers]);

	const togglesMobiles = useMemo(() => {
		return (
			<Stack direction={"column"} sx={{ mt: "20px", alignItems: "center" }}>
				<CText>GAME_SETTINGS_SEE_OTHERS</CText>
				{getToggle(seeOthers, "GAME_SETTINGS_SEE_OTHERS", setSeeOthers)}
				<CText sx={{ mt: "15px" }}>GAME_SETTINGS_FUZZY</CText>
				{getToggle(fuzzy, "GAME_SETTINGS_FUZZY", setFuzzy)}
				<CText sx={{ mt: "15px" }}>GAME_SETTINGS_SCORE_OPTION</CText>
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
					]}
					data-testid={"PGameSettings_ScoreOption"}
				></CToggle>
			</Stack>
		);
	}, [speedMode, fuzzy, seeOthers]);

	return (
		<Stack
			sx={{ position: "absolute", inset: "15px", overflowY: "auto", overflowX: "hidden" }}
			direction={{ sm: "column", md: "row" }}
		>
			<Stack direction={"column"} sx={{ mr: { sm: "0px", md: "50px" } }}>
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
					data-testid="PGameSettings_TagSearch"
				></CTextField>
				<Stack sx={PGameSettingsTagListStyle}>{tagList}</Stack>
				{!mobile && (
					<CButton
						sx={{ mt: "20px", mb: "5px", minHeight: "35px" }}
						onClick={handleOnReturn}
						data-testid="PGameSettings_Back"
					>
						<CText size="xs">GAME_SETTINGS_BACK</CText>
					</CButton>
				)}
			</Stack>
			<Stack direction={"column"} sx={{ mt: { xs: "15px", md: "0px" }, flex: 1, mr: "10px" }}>
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

				{!mobile && toggles}
				{mobile && togglesMobiles}

				<CText size="lg" sx={{ mx: 0, mt: "50px" }}>
					GAME_SETTINGS_VISIBILITY
				</CText>
				<Box sx={PGameSettingsSplitter}></Box>
				<Stack
					direction={"row"}
					sx={{ alignItems: "flex-start", justifyContent: "flex-start" }}
				>
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
								{game.current ? game.current.uid : ""}
							</CText>
						</Stack>
						<Stack direction={"row"}>
							<CButtonToggle
								sx={{ mr: "10px", p: "6px", minWidth: "50px" }}
								selected={codeVisible}
								value={"code_vidible"}
								onClick={() => {
									setCodeVisible(!codeVisible);
								}}
								data-testid={"PGameSettings_SeeCode"}
							>
								<VisibilityIcon fontSize="small" />
							</CButtonToggle>
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
				</Stack>

				<Box sx={{ flex: 1 }}></Box>
			</Stack>
			{mobile && (
				<CButton
					sx={{ mt: "20px", mb: "5px", minHeight: "35px" }}
					onClick={handleOnReturn}
					data-testid="PGameSettings_Back"
				>
					<CText size="xs">GAME_SETTINGS_BACK</CText>
				</CButton>
			)}
		</Stack>
	);
}

export default PGameSettings;
