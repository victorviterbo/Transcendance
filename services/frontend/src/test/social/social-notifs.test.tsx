import { afterEach, beforeEach, describe, beforeAll, afterAll, expect, it} from "vitest";
import { render, screen, waitFor, within} from "@testing-library/react";
import { server } from "../../mock/server";
import { mockSocialDB, mockSocialResetDB } from "../../mock/handlers/social/social_dbs";
import { CAuthProvider } from "../../components/auth/CAuthProvider";
import CWebsocket from "../../components/websocket/CWebsocket";
import { MemoryRouter } from "react-router-dom";
import GPageBase from "../../pages/common/GPageBases";
import { setAccessToken } from "../../api";
import { http, HttpResponse } from "msw";
import { API_AUTH_REFRESH } from "../../constants";
import { makeAccessToken } from "../../mock/handlers/auth";
import userEvent from "@testing-library/user-event";
import PNotifNode from "../../pages/PNotif/PNotifNode";
import type { TNotif } from "../../types/socials";
import type { IExtUserInfo } from "../../types/user";

describe("Socials - Interactions", () => {
	beforeAll(() => {
		setAccessToken("authed");
		server.listen();
		mockSocialResetDB();
	});
	beforeEach(() => {
		mockSocialResetDB();
	});
	afterEach(() => {
		server.resetHandlers()
	});
	afterAll(() => server.close());

	//ADD FRIENDS
	it("DRAWER: Checking if drawer disable when not logged in", async () => {

		render(<CAuthProvider>
				<CWebsocket>
					<MemoryRouter initialEntries={["/"]}>
						<GPageBase />
					</MemoryRouter>
				</CWebsocket>
			</CAuthProvider>);
		
		let notifDrawer;
		let notifBox;
		let notifButton;

		await waitFor(() => {

			notifDrawer = screen.queryByTestId("PNotifDrawer");
			notifBox = screen.queryByTestId("PNotif");
			notifButton = screen.queryByTestId("Notifications_ToggleButton");
			
			expect(notifDrawer).not.toBeInTheDocument();
			expect(notifBox).not.toBeInTheDocument();
			expect(notifButton).not.toBeInTheDocument();
		})
	});

	it("DRAWER: Checking if closed by dedault", async () => {

		server.use(http.post(API_AUTH_REFRESH, () => 
		{ 
				return HttpResponse.json({ access: makeAccessToken(), username: "john" }, {status: 200});
		}));

		render(<CAuthProvider>
				<CWebsocket>
					<MemoryRouter initialEntries={["/"]}>
						<GPageBase />
					</MemoryRouter>
				</CWebsocket>
			</CAuthProvider>);
		
		let notifDrawer: HTMLElement | undefined;
		let notifBox: HTMLElement | undefined;
		let notifButton: HTMLElement | undefined;

		await waitFor(() => {

			notifDrawer = screen.getByTestId("PNotifDrawer");
			notifBox = screen.getByTestId("PNotif");
			notifButton = screen.getByTestId("Notifications_ToggleButton");
			
			expect(notifDrawer).toBeInTheDocument();
			expect(notifBox).toBeInTheDocument();
			expect(notifButton).toBeInTheDocument();
		})

		if(!notifDrawer)
			return;
		expect(notifDrawer.children[0]).not.toBeNull();
		expect(notifDrawer.children[0]).not.toBeVisible();
	});

	it("DRAWER: Checking if clicking on notif panel opens", async () => {

		server.use(http.post(API_AUTH_REFRESH, () => 
		{ 
				return HttpResponse.json({ access: makeAccessToken(), username: "john" }, {status: 200});
		}));

		render(<CAuthProvider>
				<CWebsocket>
					<MemoryRouter initialEntries={["/"]}>
						<GPageBase />
					</MemoryRouter>
				</CWebsocket>
			</CAuthProvider>);
		
		let notifDrawer: HTMLElement | undefined;
		let notifBox: HTMLElement | undefined;
		let notifButton: HTMLElement | undefined;

		await waitFor(() => {

			notifDrawer = screen.getByTestId("PNotifDrawer");
			notifBox = screen.getByTestId("PNotif");
			notifButton = screen.getByTestId("Notifications_ToggleButton");
			
			expect(notifDrawer).toBeInTheDocument();
			expect(notifBox).toBeInTheDocument();
			expect(notifButton).toBeInTheDocument();
		})

		if(!notifDrawer)
			return;
		if(!notifBox)
			return;
		if(!notifButton)
			return;
		expect(notifDrawer.children[0]).not.toBeNull();
		expect(notifDrawer.children[0]).not.toBeVisible();


		await userEvent.click(notifButton);

		
		expect(notifDrawer.children[0]).not.toBeNull();
		expect(notifDrawer.children[0]).toBeVisible();
		expect(screen.getByText("NOTIF_TITLE")).toBeInTheDocument();
	});

	it("BUTTON: Checking notification count", {timeout: 10000}, async () => {

		server.use(http.post(API_AUTH_REFRESH, () => 
		{ 
				return HttpResponse.json({ access: makeAccessToken(), username: "john" }, {status: 200});
		}));

		render(<CAuthProvider>
				<CWebsocket>
					<MemoryRouter initialEntries={["/"]}>
						<GPageBase />
					</MemoryRouter>
				</CWebsocket>
			</CAuthProvider>);
		
		let notifDrawer: HTMLElement | undefined;
		let notifBox: HTMLElement | undefined;
		let notifButton: HTMLElement | undefined;

		await waitFor(() => {

			notifDrawer = screen.getByTestId("PNotifDrawer");
			notifBox = screen.getByTestId("PNotif");
			notifButton = screen.getByTestId("Notifications_ToggleButton");
			
			expect(notifDrawer).toBeInTheDocument();
			expect(notifBox).toBeInTheDocument();
			expect(notifButton).toBeInTheDocument();
		})

		if(!notifDrawer)
			return;
		if(!notifBox)
			return;
		if(!notifButton)
			return;

		const parentButton = screen.getByTestId("Notifications_ToggleButtonParent");
		expect(parentButton).toBeInTheDocument();
		
		let notifValue: HTMLElement | undefined | null;		
		await waitFor(() => {
			notifValue = within(parentButton).getByTestId("CButtonToggleNotif");
			expect(notifValue).toBeInTheDocument();
			expect(within(notifValue).getByText("2")).toBeInTheDocument();
		});
			
		await waitFor(() => {
			notifValue = within(parentButton).getByTestId("CButtonToggleNotif");
			expect(notifValue).toBeInTheDocument();
			expect(within(notifValue).getByText("3")).toBeInTheDocument();
		}, {timeout: 5500});

		await userEvent.click(notifButton);
			
		await waitFor(() => {
			notifValue = within(parentButton).queryByTestId("CButtonToggleNotif");
			expect(notifValue).not.toBeInTheDocument();
		}, {timeout: 3000});
	});

	

	it("BUTTON: Checking notification count opnend between", {timeout: 10000}, async () => {

		server.use(http.post(API_AUTH_REFRESH, () => 
		{ 
				return HttpResponse.json({ access: makeAccessToken(), username: "john" }, {status: 200});
		}));

		render(<CAuthProvider>
				<CWebsocket>
					<MemoryRouter initialEntries={["/"]}>
						<GPageBase />
					</MemoryRouter>
				</CWebsocket>
			</CAuthProvider>);
		
		let notifDrawer: HTMLElement | undefined;
		let notifBox: HTMLElement | undefined;
		let notifButton: HTMLElement | undefined;

		await waitFor(() => {

			notifDrawer = screen.getByTestId("PNotifDrawer");
			notifBox = screen.getByTestId("PNotif");
			notifButton = screen.getByTestId("Notifications_ToggleButton");
			
			expect(notifDrawer).toBeInTheDocument();
			expect(notifBox).toBeInTheDocument();
			expect(notifButton).toBeInTheDocument();
		})

		if(!notifDrawer)
			return;
		if(!notifBox)
			return;
		if(!notifButton)
			return;

		const parentButton = screen.getByTestId("Notifications_ToggleButtonParent");
		expect(parentButton).toBeInTheDocument();
		
		let notifValue: HTMLElement | undefined | null;		
		await waitFor(() => {
			notifValue = within(parentButton).getByTestId("CButtonToggleNotif");
			expect(notifValue).toBeInTheDocument();
			expect(within(notifValue).getByText("2")).toBeInTheDocument();
		});
		

		await userEvent.click(notifButton);
			
		await waitFor(() => {
			notifValue = within(parentButton).queryByTestId("CButtonToggleNotif");
			expect(notifValue).not.toBeInTheDocument();
		}, {timeout: 3000});

		await userEvent.click(notifButton);
			
		await waitFor(() => {
			notifValue = within(parentButton).getByTestId("CButtonToggleNotif");
			expect(notifValue).toBeInTheDocument();
			expect(within(notifValue).getByText("1")).toBeInTheDocument();
		}, {timeout: 5500});
	});


	it.each([
		[new Date(Date.now()), "NOTIF_AGO_LESS", true], 
		[new Date(Date.now() - 1000 * 60 * 60 * 4), "NOTIF_AGO_HOURS COUNT: 4", true],
		[new Date(Date.now() - 1000 * 60 * 25), "NOTIF_AGO_MINUTES COUNT: 25", false],
		[new Date(Date.now() - 1000 * 60 * 60 * 24 * 123), "NOTIF_AGO_DAYS COUNT: 123", false]
	])("NODE: Checking base infos (Date: %s, Expect: %s Read: %d)", async (DateIN, ExpectDate, ReadIn) => {

		const user: IExtUserInfo = mockSocialDB.users[0];
		const notif: TNotif = {
			uid: crypto.randomUUID(),
			kind: "friend-request",
			from: mockSocialDB.users[0],
			date: DateIN,
			read: ReadIn
		};

		render(<PNotifNode notif={notif}></PNotifNode>);

		expect(screen.getByText("NOTIF_FRIEND_REQ")).toBeInTheDocument();
		expect(screen.getByText(user.username)).toBeInTheDocument();
		expect(screen.getByText(ExpectDate)).toBeInTheDocument();

		const  node = screen.getByTestId("PNotifNode");
		expect(node).toBeInTheDocument();

		if(ReadIn == false)
			expect(window.getComputedStyle(node).background == "linear-gradient(160deg, #8A41FA 0%, #1FE2D8 100%) rgba(0, 0, 0, 0)").toBeTruthy();
		else
			expect(window.getComputedStyle(node).background == "linear-gradient(160deg, #9E9E9E 0%, #727272 100%) rgba(0, 0, 0, 0)").toBeTruthy();
	})


	it("NODES: Counting notifs", {timeout: 10000}, async () => {

		server.use(http.post(API_AUTH_REFRESH, () => 
		{ 
				return HttpResponse.json({ access: makeAccessToken(), username: "john" }, {status: 200});
		}));

		render(<CAuthProvider>
				<CWebsocket>
					<MemoryRouter initialEntries={["/"]}>
						<GPageBase />
					</MemoryRouter>
				</CWebsocket>
			</CAuthProvider>);
		
		let notifDrawer: HTMLElement | undefined;
		let notifBox: HTMLElement | undefined;
		let notifButton: HTMLElement | undefined;

		await waitFor(() => {

			notifDrawer = screen.getByTestId("PNotifDrawer");
			notifBox = screen.getByTestId("PNotif");
			notifButton = screen.getByTestId("Notifications_ToggleButton");
			
			expect(notifDrawer).toBeInTheDocument();
			expect(notifBox).toBeInTheDocument();
			expect(notifButton).toBeInTheDocument();
		})

		if(!notifDrawer)
			return;
		if(!notifBox)
			return;
		if(!notifButton)
			return;

		await userEvent.click(notifButton);
		 
		const parentButton = screen.getByTestId("Notifications_ToggleButtonParent");
		expect(parentButton).toBeInTheDocument();
		
		await waitFor(() => {
			const  nodes = screen.getAllByTestId("PNotifNode");
			expect(nodes.length).toEqual(4);
		});
			
		await waitFor(() => {
			const  nodes = screen.getAllByTestId("PNotifNode");
			expect(nodes.length).toEqual(5);
		}, {timeout: 5500});
	});



	it("NODES: Counting notifs (Colors)", {timeout: 10000}, async () => {

		server.use(http.post(API_AUTH_REFRESH, () => 
		{ 
				return HttpResponse.json({ access: makeAccessToken(), username: "john" }, {status: 200});
		}));

		render(<CAuthProvider>
				<CWebsocket>
					<MemoryRouter initialEntries={["/"]}>
						<GPageBase />
					</MemoryRouter>
				</CWebsocket>
			</CAuthProvider>);
		
		let notifDrawer: HTMLElement | undefined;
		let notifBox: HTMLElement | undefined;
		let notifButton: HTMLElement | undefined;

		await waitFor(() => {

			notifDrawer = screen.getByTestId("PNotifDrawer");
			notifBox = screen.getByTestId("PNotif");
			notifButton = screen.getByTestId("Notifications_ToggleButton");
			
			expect(notifDrawer).toBeInTheDocument();
			expect(notifBox).toBeInTheDocument();
			expect(notifButton).toBeInTheDocument();
		})

		if(!notifDrawer)
			return;
		if(!notifBox)
			return;
		if(!notifButton)
			return;
		 
		const parentButton = screen.getByTestId("Notifications_ToggleButtonParent");
		expect(parentButton).toBeInTheDocument();


		await waitFor(() => {
			const  nodes = screen.getAllByTestId("PNotifNode");
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #8A41FA 0%, #1FE2D8 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(2);
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #9E9E9E 0%, #727272 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(2);
		});

		
		await waitFor(() => {
			const  nodes = screen.getAllByTestId("PNotifNode");
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #8A41FA 0%, #1FE2D8 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(3);
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #9E9E9E 0%, #727272 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(2);
		}, {timeout: 5500});

		await userEvent.click(notifButton);

		await waitFor(() => {
			const  nodes = screen.getAllByTestId("PNotifNode");
			//nodes.forEach(el => console.error(el.innerHTML));
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #8A41FA 0%, #1FE2D8 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(0);
			const len = nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #9E9E9E 0%, #727272 100%) rgba(0, 0, 0, 0)";
			}).length
			expect(len == 5 || len == 6).toBeTruthy();
		}, {timeout: 3000});
	});

	it("NODES: Counting notifs (Colors) opened btw", {timeout: 10000}, async () => {

		server.use(http.post(API_AUTH_REFRESH, () => 
		{ 
				return HttpResponse.json({ access: makeAccessToken(), username: "john" }, {status: 200});
		}));

		render(<CAuthProvider>
				<CWebsocket>
					<MemoryRouter initialEntries={["/"]}>
						<GPageBase />
					</MemoryRouter>
				</CWebsocket>
			</CAuthProvider>);
		
		let notifDrawer: HTMLElement | undefined;
		let notifBox: HTMLElement | undefined;
		let notifButton: HTMLElement | undefined;

		await waitFor(() => {

			notifDrawer = screen.getByTestId("PNotifDrawer");
			notifBox = screen.getByTestId("PNotif");
			notifButton = screen.getByTestId("Notifications_ToggleButton");
			
			expect(notifDrawer).toBeInTheDocument();
			expect(notifBox).toBeInTheDocument();
			expect(notifButton).toBeInTheDocument();
		})

		if(!notifDrawer)
			return;
		if(!notifBox)
			return;
		if(!notifButton)
			return;
		 
		const parentButton = screen.getByTestId("Notifications_ToggleButtonParent");
		expect(parentButton).toBeInTheDocument();


		await waitFor(() => {
			const  nodes = screen.getAllByTestId("PNotifNode");
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #8A41FA 0%, #1FE2D8 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(2);
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #9E9E9E 0%, #727272 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(2);
		});

		await userEvent.click(notifButton);

		await waitFor(() => {
			const  nodes = screen.getAllByTestId("PNotifNode");
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #8A41FA 0%, #1FE2D8 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(0);
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #9E9E9E 0%, #727272 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(4);
		}, {timeout: 3000});

		
		await waitFor(() => {
			const  nodes = screen.getAllByTestId("PNotifNode");
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #8A41FA 0%, #1FE2D8 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(1);
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #9E9E9E 0%, #727272 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(4);
		}, {timeout: 5500});

		await waitFor(() => {
			const  nodes = screen.getAllByTestId("PNotifNode");
			//nodes.forEach(el => console.error(el.innerHTML));
			expect(nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #8A41FA 0%, #1FE2D8 100%) rgba(0, 0, 0, 0)";
			}).length).toEqual(0);
			const len = nodes.filter((el: HTMLElement) => {
				return window.getComputedStyle(el).background === "linear-gradient(160deg, #9E9E9E 0%, #727272 100%) rgba(0, 0, 0, 0)";
			}).length
			expect(len == 5 || len == 6).toBeTruthy();
		}, {timeout: 3000});
	});


	it("NODES: Click on see requests button", {timeout: 7500}, async () => {

		server.use(http.post(API_AUTH_REFRESH, () => 
		{ 
				return HttpResponse.json({ access: makeAccessToken(), username: "john" }, {status: 200});
		}));

		render(<CAuthProvider>
				<CWebsocket>
					<MemoryRouter initialEntries={["/"]}>
						<GPageBase />
					</MemoryRouter>
				</CWebsocket>
			</CAuthProvider>);
		
		let notifDrawer: HTMLElement | undefined;
		let notifBox: HTMLElement | undefined;
		let notifButton: HTMLElement | undefined;

		await waitFor(() => {

			notifDrawer = screen.getByTestId("PNotifDrawer");
			notifBox = screen.getByTestId("PNotif");
			notifButton = screen.getByTestId("Notifications_ToggleButton");
			
			expect(notifDrawer).toBeInTheDocument();
			expect(notifBox).toBeInTheDocument();
			expect(notifButton).toBeInTheDocument();
		})

		if(!notifDrawer)
			return;
		if(!notifBox)
			return;
		if(!notifButton)
			return;
		 
		const parentButton = screen.getByTestId("Notifications_ToggleButtonParent");
		expect(parentButton).toBeInTheDocument();

		await userEvent.click(notifButton);

		let nodes: HTMLElement[] = []
		await waitFor(() => {
			nodes = screen.getAllByTestId("PNotifNode");
			expect(nodes.length).toEqual(4);
		});

		const button = within(nodes[0]).getByTestId("PNotifNodeSeeReq");
		expect(button).toBeInTheDocument();

		await userEvent.click(button);

		await waitFor(() => {
			expect(screen.getAllByTestId("PFriendNode_ValidButton").length).toEqual(4);
		});

		await waitFor(() => {
			expect(screen.getAllByTestId("PFriendNode_ValidButton").length).toEqual(5);
		}, {timeout: 5500});
	});
});