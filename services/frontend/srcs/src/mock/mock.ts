var mockStart = async function () {
	const { worker } = await import("./browser");
	await worker.start({
		onUnhandledRequest: "bypass", // let unknown requests hit the real network
	});
};

export default mockStart;
