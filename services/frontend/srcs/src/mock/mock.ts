const mockStart = async () => {
	if (import.meta.env.MODE !== "mock") {
		console.log("MSW disabled");
		return;
	}

	const { worker } = await import("./browser");
	await worker.start({
		onUnhandledRequest: "bypass", // let unknown requests hit the real network
	});
};

export default mockStart;
