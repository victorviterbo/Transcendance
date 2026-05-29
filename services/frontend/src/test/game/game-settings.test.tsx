import { afterEach, beforeEach, describe, beforeAll, afterAll, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { setAccessToken } from "../../api";
import { server } from "../../mock/server";
import { mockSocialResetDB } from "../../mock/handlers/social/social_dbs";
import { mockSetGameError } from "../../mock/handlers/game/game";
import type { IGameSettings } from "../../types/game";
import { CAuthProvider } from "../../components/auth/CAuthProvider";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PGameBase from "../../pages/PGame/PGameBase";
import userEvent from "@testing-library/user-event";
import { mockGetGameData, type IMockGameData } from "../../mock/handlers/game/game_db";
import { ttr } from "../../localization/localization";
import { vitestCheckSettings } from "./game-shared";

const renderPage = () => {
	render(
		<CAuthProvider>
			<MemoryRouter initialEntries={["/game/789"]}>
				<Routes>
					<Route path="/game/:gameid" element={<PGameBase />} />
				</Routes>
			</MemoryRouter>
		</CAuthProvider>,
	);
};

const switchView = async () => {
	let settingsButtons: HTMLElement | undefined = undefined;
	await waitFor(() => {
		settingsButtons = screen.getByText("GAME_EDIT");
		expect(settingsButtons).toBeInTheDocument();
	});

	if (!settingsButtons) return;
	await userEvent.click(settingsButtons);
};

describe("Tests for settings view", () => {
	beforeAll(() => {
		setAccessToken("authed");
		server.listen();
		mockSocialResetDB();
	});
	beforeEach(() => {
		window.history.pushState({}, "", "/game/789");
		mockSetGameError(false);
		mockSocialResetDB();
	});
	afterEach(() => {
		server.resetHandlers();
	});
	afterAll(() => server.close());

	it("Checking all about tags selection", async () => {
		renderPage();
		await switchView();

		expect(screen.getByText("GAME_SETTINGS_TITLE")).toBeInTheDocument();
	});

	it("Checking all about tags selection", async () => {
		renderPage();
		await switchView();
		const data: IMockGameData = mockGetGameData("789");

		//DEFAULT SELECTION
		let tagList: HTMLElement[] = [];
		await waitFor(() => {
			expect(screen.queryByText("GAME_EDIT")).not.toBeInTheDocument();
			tagList = screen.getAllByTestId("PGameSettings_Tag");
			expect(tagList.length).toEqual(Object.keys(data.settings.tags).length);
			Object.keys(data.settings.tags).forEach((key: string) => {
				const target: HTMLElement | undefined = tagList.find((el: HTMLElement) => {
					return within(el).queryByText(ttr(key)) == undefined ? false : true;
				});
				expect(target).toBeInTheDocument();
				if (!target) throw "Target '" + key + "' not found";
				const isPressed: boolean = target.getAttribute("aria-pressed") == "true";
				expect(isPressed).toEqual(data.settings.tags[key]);
			});
		});

		//PRESSING BUTTON
		let rnbButton: HTMLElement | undefined = tagList.find((el: HTMLElement) => {
			return within(el).queryByText("RNB") == undefined ? false : true;
		});
		expect(rnbButton).toBeInTheDocument();
		if (!rnbButton) throw "Target 'RNB' not found";

		await userEvent.click(rnbButton);

		await waitFor(() => {
			tagList = screen.getAllByTestId("PGameSettings_Tag");
			rnbButton = tagList.find((el: HTMLElement) => {
				return within(el).queryByText("RNB") == undefined ? false : true;
			});
			expect(rnbButton).toBeInTheDocument();
			if (!rnbButton) throw "Target 'RNB' not found";
			const isPressed: boolean = rnbButton.getAttribute("aria-pressed") == "true";
			expect(isPressed).toEqual(true);
		});

		//SEARCHING FOR TAGS
		const searchField = screen.getByTestId("PGameSettings_TagSearch");
		expect(searchField).toBeInTheDocument();
		const input = within(searchField).getByRole("textbox");
		await userEvent.type(input, "Ro");

		await waitFor(() => {
			tagList = screen.getAllByTestId("PGameSettings_Tag");
			expect(tagList.length).toEqual(2);
		});
	});

	it.each([
		["GAME_SETTINGS_NB_MUSIC", "nbMusic", 50, false],
		["GAME_SETTINGS_MUSIC_TIMER", "timer", 30, true],
		["GAME_SETTINGS_BREAK_TIMER", "breakTimer", 30, true],
	])(
		"Checking slider bars: %s (Setting: %s - max: %d)",
		async (label: string, setting: string, max: number, step: boolean) => {
			renderPage();
			await switchView();
			const data: IMockGameData = mockGetGameData("789");

			let slider: HTMLElement | undefined;
			let titleText: HTMLElement | undefined;

			await waitFor(() => {
				slider = screen.getByTestId("PGameSettings_Slider_" + label);
				titleText = screen.getByTestId("PGameSettings_SliderTitle_" + label);
				expect(slider).toBeInTheDocument();
				expect(titleText).toBeInTheDocument();
			});

			if (!titleText || !slider) return;

			expect(titleText).toHaveTextContent(
				Number(data.settings[setting as keyof IGameSettings]).toString(),
			);

			await fireEvent.change(within(slider).getByRole("slider"), { target: { value: 5 } });
			expect(titleText).toHaveTextContent("5");
			await fireEvent.change(within(slider).getByRole("slider"), { target: { value: 29 } });
			expect(titleText).toHaveTextContent(step ? "25" : "29");
			await fireEvent.change(within(slider).getByRole("slider"), { target: { value: 2 } });
			expect(titleText).toHaveTextContent("5");
			await fireEvent.change(within(slider).getByRole("slider"), { target: { value: 90 } });
			expect(titleText).toHaveTextContent(Number(max).toString());
		},
	);

	it.each([
		["GAME_SETTINGS_SEE_OTHERS", "seeOthers"],
		["GAME_SETTINGS_FUZZY", "fuzzy"],
	])("Checking toogle buttons: %s (Setting: %s)", async (label: string, setting: string) => {
		renderPage();
		await switchView();
		const data: IMockGameData = mockGetGameData("789");

		let button: HTMLElement | undefined;
		await waitFor(() => {
			expect(screen.getByText(label)).toBeInTheDocument();
			button = screen.getByTestId("PGameSettings_Toggle_" + label);
			expect(button.getAttribute("aria-pressed")).toEqual(
				data.settings[setting as keyof IGameSettings] ? "true" : "false",
			);
		});

		if (!button) return;

		await userEvent.click(button);
		await waitFor(() => {
			if (!button) return;
			expect(button.getAttribute("aria-pressed")).toEqual(
				!data.settings[setting as keyof IGameSettings] ? "true" : "false",
			);
		});
	});

	it("Checking score options", async () => {
		renderPage();
		await switchView();

		let options: HTMLElement | undefined;
		await waitFor(() => {
			options = screen.getByTestId("PGameSettings_ScoreOption");
			expect(options).toBeInTheDocument();
		});

		if (!options) return;

		expect(within(options).getByText("GAME_SETTINGS_SCORE_OPTION_SPEED")).toBeInTheDocument();
		expect(within(options).getByText("GAME_SETTINGS_SCORE_OPTION_NORMAL")).toBeInTheDocument();
		expect(within(options).getByText("GAME_SETTINGS_SCORE_OPTION_ARMAGEDDON")).toBeInTheDocument();

		const buttonList = within(options).getAllByRole("button");
		expect(buttonList.length).toEqual(3);
		const speedButton: HTMLElement | undefined = buttonList.find((el: HTMLElement) => {
			return within(el).queryByText("GAME_SETTINGS_SCORE_OPTION_SPEED") ? true : false;
		});
		expect(speedButton).toBeInTheDocument();
		const normalButton: HTMLElement | undefined = buttonList.find((el: HTMLElement) => {
			return within(el).queryByText("GAME_SETTINGS_SCORE_OPTION_NORMAL") ? true : false;
		});
		expect(normalButton).toBeInTheDocument();
		const armaButton: HTMLElement | undefined = buttonList.find((el: HTMLElement) => {
			return within(el).queryByText("GAME_SETTINGS_SCORE_OPTION_ARMAGEDDON") ? true : false;
		});
		expect(armaButton).toBeInTheDocument();

		if (!speedButton || !normalButton || !armaButton) return;

		expect(speedButton.getAttribute("aria-pressed")).toEqual("true");
		expect(normalButton.getAttribute("aria-pressed")).toEqual("false");
		expect(armaButton.getAttribute("aria-pressed")).toEqual("false");

		await userEvent.click(normalButton);

		await waitFor(() => {
			expect(speedButton.getAttribute("aria-pressed")).toEqual("false");
			expect(normalButton.getAttribute("aria-pressed")).toEqual("true");
			expect(armaButton.getAttribute("aria-pressed")).toEqual("false");
		});

		await userEvent.click(armaButton);

		await waitFor(() => {
			expect(speedButton.getAttribute("aria-pressed")).toEqual("false");
			expect(normalButton.getAttribute("aria-pressed")).toEqual("false");
			expect(armaButton.getAttribute("aria-pressed")).toEqual("true");
		});
	});

	it("Checking visibility options", async () => {
		renderPage();
		await switchView();

		let options: HTMLElement | undefined;
		await waitFor(() => {
			options = screen.getByTestId("PGameSettings_VisibilityOption");
			expect(options).toBeInTheDocument();
		});

		if (!options) return;

		expect(within(options).getByText("PRIVATE")).toBeInTheDocument();
		expect(within(options).getByText("PUBLIC")).toBeInTheDocument();

		const buttonList = within(options).getAllByRole("button");
		expect(buttonList.length).toEqual(2);
		const privateButton: HTMLElement | undefined = buttonList.find((el: HTMLElement) => {
			return within(el).queryByText("PRIVATE") ? true : false;
		});
		expect(privateButton).toBeInTheDocument();
		const publicButton: HTMLElement | undefined = buttonList.find((el: HTMLElement) => {
			return within(el).queryByText("PUBLIC") ? true : false;
		});
		expect(publicButton).toBeInTheDocument();

		if (!privateButton || !publicButton) return;

		expect(privateButton.getAttribute("aria-pressed")).toEqual("true");
		expect(publicButton.getAttribute("aria-pressed")).toEqual("false");

		await userEvent.click(publicButton);

		await waitFor(() => {
			expect(privateButton.getAttribute("aria-pressed")).toEqual("false");
			expect(publicButton.getAttribute("aria-pressed")).toEqual("true");
		});
	});

	it("Checking code section", async () => {
		renderPage();
		await switchView();
		const data: IMockGameData = mockGetGameData("789");

		await waitFor(() => {
			expect(screen.getByText("GAME_SETTINGS_CODE")).toBeInTheDocument();
			expect(screen.getByText(data.settings.code)).toBeInTheDocument();
		});

		expect(
			window.getComputedStyle(screen.getByText(data.settings.code)).filter.includes("blur"),
		).toBeTruthy();

		const seeButton = screen.getByTestId("PGameSettings_SeeCode");
		expect(seeButton).toBeInTheDocument();

		//SHOW PW
		await userEvent.click(seeButton);
		expect(window.getComputedStyle(screen.getByText(data.settings.code)).filter).toEqual("");

		//COPY PW
		const copyButton = screen.getByText("GAME_SETTINGS_CB");
		expect(copyButton).toBeInTheDocument();
	});

	it("Interact and save", async () => {
		renderPage();
		await switchView();
		const data: IMockGameData = mockGetGameData("789");

		//TAGS
		let tagList: HTMLElement[] = [];
		await waitFor(() => {
			expect(screen.queryByText("GAME_EDIT")).not.toBeInTheDocument();
			tagList = screen.getAllByTestId("PGameSettings_Tag");
			expect(tagList.length).toEqual(Object.keys(data.settings.tags).length);
		});

		const popButton: HTMLElement | undefined = tagList.find((el: HTMLElement) => {
			return within(el).queryByText(ttr("TAG_POP")) ? true : false;
		});
		expect(popButton).toBeInTheDocument();
		if (!popButton) return;
		await userEvent.click(popButton);

		const RNBButton: HTMLElement | undefined = tagList.find((el: HTMLElement) => {
			return within(el).queryByText(ttr("TAG_RNB")) ? true : false;
		});
		expect(RNBButton).toBeInTheDocument();
		if (!RNBButton) return;
		await userEvent.click(RNBButton);

		//SLIDER
		let sliderNbMusic: HTMLElement | undefined;
		let sliderTimer: HTMLElement | undefined;
		let sliderBreakTimer: HTMLElement | undefined;

		await waitFor(() => {
			sliderNbMusic = screen.getByTestId("PGameSettings_Slider_GAME_SETTINGS_NB_MUSIC");
			expect(sliderNbMusic).toBeInTheDocument();
			sliderTimer = screen.getByTestId("PGameSettings_Slider_GAME_SETTINGS_MUSIC_TIMER");
			expect(sliderTimer).toBeInTheDocument();
			sliderBreakTimer = screen.getByTestId("PGameSettings_Slider_GAME_SETTINGS_BREAK_TIMER");
			expect(sliderBreakTimer).toBeInTheDocument();
		});

		if (!sliderNbMusic || !sliderTimer || !sliderBreakTimer) return;
		await fireEvent.change(within(sliderNbMusic).getByRole("slider"), { target: { value: 5 } });
		await fireEvent.change(within(sliderTimer).getByRole("slider"), { target: { value: 23 } });
		await fireEvent.change(within(sliderBreakTimer).getByRole("slider"), {
			target: { value: 10 },
		});

		//TOGGLE
		const seeOtherButton: HTMLElement = screen.getByTestId(
			"PGameSettings_Toggle_GAME_SETTINGS_SEE_OTHERS",
		);
		expect(seeOtherButton).toBeInTheDocument();
		await userEvent.click(seeOtherButton);

		const fuzzyButton: HTMLElement = screen.getByTestId(
			"PGameSettings_Toggle_GAME_SETTINGS_FUZZY",
		);
		expect(fuzzyButton).toBeInTheDocument();
		await userEvent.click(fuzzyButton);

		//SCORE OPTIONS
		const options: HTMLElement = screen.getByTestId("PGameSettings_ScoreOption");
		expect(options).toBeInTheDocument();
		const buttonList = within(options).getAllByRole("button");
		expect(buttonList.length).toEqual(3);
		const speedButton: HTMLElement | undefined = buttonList.find((el: HTMLElement) => {
			return within(el).queryByText("GAME_SETTINGS_SCORE_OPTION_SPEED") ? true : false;
		});
		expect(speedButton).toBeInTheDocument();
		const normalButton: HTMLElement | undefined = buttonList.find((el: HTMLElement) => {
			return within(el).queryByText("GAME_SETTINGS_SCORE_OPTION_NORMAL") ? true : false;
		});
		expect(normalButton).toBeInTheDocument();
		const armaButton: HTMLElement | undefined = buttonList.find((el: HTMLElement) => {
			return within(el).queryByText("GAME_SETTINGS_SCORE_OPTION_ARMAGEDDON") ? true : false;
		});
		expect(armaButton).toBeInTheDocument();

		if (!speedButton || !normalButton || !armaButton) return;

		await userEvent.click(normalButton);

		//VISIBILITY
		const visibility = screen.getByTestId("PGameSettings_VisibilityOption");
		expect(visibility).toBeInTheDocument();
		const visibilityList = within(visibility).getAllByRole("button");
		expect(visibilityList.length).toEqual(2);
		const privateButton: HTMLElement | undefined = visibilityList.find((el: HTMLElement) => {
			return within(el).queryByText("PRIVATE") ? true : false;
		});
		expect(privateButton).toBeInTheDocument();
		const publicButton: HTMLElement | undefined = visibilityList.find((el: HTMLElement) => {
			return within(el).queryByText("PUBLIC") ? true : false;
		});
		expect(publicButton).toBeInTheDocument();

		if (!privateButton || !publicButton) return;

		await userEvent.click(publicButton);

		//SAVE
		const backButton = screen.getByTestId("PGameSettings_Back");
		expect(backButton).toBeInTheDocument();

		await userEvent.click(backButton);

		await waitFor(() => {
			expect(data.settings.tags["TAG_POP"]).toEqual(false);
			expect(data.settings.tags["TAG_RNB"]).toEqual(true);
			expect(data.settings.nbMusic).toEqual(5);
			expect(data.settings.timer).toEqual(20);
			expect(data.settings.breakTimer).toEqual(10);
			expect(data.settings.seeOthers).toEqual(false);
			expect(data.settings.fuzzy).toEqual(false);
			expect(data.settings.scoreOption).toEqual("normal");
			expect(data.settings.scope).toEqual("public");
		});

		await waitFor(() => {
			vitestCheckSettings(data.settings);
		});
	});
});
