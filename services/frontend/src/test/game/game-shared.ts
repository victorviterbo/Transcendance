import { expect } from "vitest";
import { screen, within } from "@testing-library/react";
import type { IGameSettings } from "../../types/game";
import { ttr } from "../../localization/localization";

export const vitestCheckSettings = (settings: IGameSettings) => {
	//TAGS
	Object.keys(settings.tags).forEach((key: string) => {
		if (settings.tags[key]) expect(screen.getByText(ttr(key))).toBeInTheDocument();
		else expect(screen.queryByText(ttr(key))).not.toBeInTheDocument();
	});

	//SCORING
	expect(screen.getByText("GAME_SETTINGS_SCORE_OPTION")).toBeInTheDocument();
	if (settings.scoreOption == "speed")
		expect(screen.getByText("GAME_SETTINGS_SCORE_OPTION_SPEED")).toBeInTheDocument();
	else expect(screen.queryByText("GAME_SETTINGS_SCORE_OPTION_SPEED")).not.toBeInTheDocument();

	if (settings.scoreOption == "normal")
		expect(screen.getByText("GAME_SETTINGS_SCORE_OPTION_NORMAL")).toBeInTheDocument();
	else expect(screen.queryByText("GAME_SETTINGS_SCORE_OPTION_NORMAL")).not.toBeInTheDocument();

	//TOOGLES
	expect(screen.getByText("GAME_SETTINGS_SEE_OTHERS")).toBeInTheDocument();
	const seeOtherToggle = screen.getByTestId("GAME_SETTINGS_SEE_OTHERS");
	expect(seeOtherToggle).toBeInTheDocument();
	expect(within(seeOtherToggle).getByTestId(settings.seeOthers ? "DoneIcon" : "CloseIcon"));

	expect(screen.getByText("GAME_SETTINGS_FUZZY")).toBeInTheDocument();
	const fuzzyToggle = screen.getByTestId("GAME_SETTINGS_FUZZY");
	expect(fuzzyToggle).toBeInTheDocument();
	expect(within(fuzzyToggle).getByTestId(settings.fuzzy ? "DoneIcon" : "CloseIcon"));

	//SLIDER
	const nbMusicText = screen.getByTestId("PGameLobby_GAME_SETTINGS_NB_MUSIC");
	expect(nbMusicText).toBeInTheDocument();
	expect(nbMusicText.textContent).toEqual("Number of musics: " + settings.nbMusic);

	const timerText = screen.getByTestId("PGameLobby_GAME_SETTINGS_MUSIC_TIMER");
	expect(timerText).toBeInTheDocument();
	expect(timerText.textContent).toEqual("Music timer: " + settings.timer + "s");

	const breakTimerText = screen.getByTestId("PGameLobby_GAME_SETTINGS_BREAK_TIMER");
	expect(breakTimerText).toBeInTheDocument();
	expect(breakTimerText.textContent).toEqual("Break timer: " + settings.breakTimer + "s");
};
