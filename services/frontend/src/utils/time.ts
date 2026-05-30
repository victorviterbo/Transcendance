type TTimeunit = "miliseconds" | "seconds";

export function timeGetElapse(From: number, Unit: TTimeunit): number {
	const dif: number = Date.now() - From;
	if (Unit == "seconds") return Math.trunc(dif / 1000);
	return dif;
}
