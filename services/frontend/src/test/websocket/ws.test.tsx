import { useCallback, useEffect, useState } from "react";
import CText from "../../components/text/CText";
import CWebsocket, { useWS } from "../../components/websocket/CWebsocket";
import type { IWSContextModule, TWSRcv } from "../../types/websocket";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { server } from "../../mock/server";
import CButton from "../../components/inputs/buttons/CButton";
import userEvent from "@testing-library/user-event";

function TestWSCounter() {
	const wsContext: IWSContextModule = useWS("test_counter");
	const [counter, setCounter] = useState<number>(0);

	useEffect(() => {
		wsContext.setOnUpdate(() => {
			while (wsContext.count > 0) {
				const last: TWSRcv | undefined = wsContext.getLast();
				if (last?.target == "test_counter") setCounter(last.count);
			}
		});
	}, [wsContext]);

	const onCounterEvent = useCallback(() => {
		wsContext.sendMessage(JSON.stringify({ target: "test_counter_event" } as TWSRcv));
	}, [wsContext]);

	return (
		<>
			<CButton onClick={onCounterEvent}>Test</CButton>
			<CText>{counter}</CText>
		</>
	);
}

describe("Websocket - data recieve", () => {
	beforeAll(() => server.listen());
	afterEach(() => server.resetHandlers());
	afterAll(() => server.close());

	//ADD FRIENDS
	it("Checking send & rcv", async () => {
		render(
			<CWebsocket>
				<TestWSCounter />
			</CWebsocket>,
		);

		const button = screen.getByText("Test");
		expect(button).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText("0")).toBeInTheDocument();
		});

		let counter = 0;
		while (counter < 100) {
			counter++;
			await userEvent.click(button);
			expect(screen.getByText(counter)).toBeInTheDocument();
		}
	});
});
