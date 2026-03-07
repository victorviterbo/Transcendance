import type { TDropShadow } from "../types/styles";

//--------------------------------------------------
//                    CSS
//--------------------------------------------------
export function TDropShadowToString(Input: TDropShadow | string): string {
	if (typeof Input == "string") return Input;
	let finalSTR = "";
	finalSTR += (typeof Input.offsetX == "number" ? Input.offsetX + "px" : Input.offsetX) + " ";
	finalSTR += (typeof Input.offsetY == "number" ? Input.offsetY + "px" : Input.offsetY) + " ";
	if (Input.blur != undefined && Input.blur != null)
		finalSTR += (typeof Input.blur == "number" ? Input.blur + "px" : Input.blur) + " ";
	finalSTR += Input.color;
	return finalSTR;
}

//--------------------------------------------------
//               COLOR MANAGEMENT
//--------------------------------------------------
export function getBackground(
	colors: string | string[],
	positions?: number[],
	type?: "linear" | "radial",
	angle?: number,
): string {
	if (typeof colors == "string") return colors;

	if (!type) type = "linear";
	if (!angle) angle = 0;
	if (!positions) {
		positions = [];
		colors.forEach((_: string, index: number) => {
			positions?.push((1 / (colors.length - 1)) * index * 100);
		});
	}

	let finalStr = type + "-gradient(";
	if (type == "linear") finalStr += angle + "deg";
	colors.forEach((item, index) => {
		if (finalStr.lastIndexOf("(") != finalStr.length - 1) finalStr += ", ";
		finalStr += item + " " + positions[index] + "%";
	});
	finalStr += ")";
	return finalStr;
}
