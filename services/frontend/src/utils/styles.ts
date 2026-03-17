import type { TColor, TColorAlteration, TDropShadow } from "../types/styles";

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

export function cssAddSizes(value1?: number | string, value2?: number | string) {
	if (!value1 && !value2) return "inherit";
	if (!value1) return sizeMakeString(value2);
	if (!value2) return sizeMakeString(value1);

	console.log(
		value1,
		value2,
		"calc(" + sizeMakeString(value1) + " + " + sizeMakeString(value2) + ")",
	);
	return "calc(" + sizeMakeString(value1) + " + " + sizeMakeString(value2) + ")";
}
export function sizeMakeString(value?: string | number) {
	return value ? (typeof value == "string" ? value : value + "px") : "inherit";
}

//--------------------------------------------------
//               COLOR MANAGEMENT
//--------------------------------------------------
export function colorGetBackground(
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

export function colorAlterColor(
	color: string,
	alter: TColorAlteration | TColorAlteration[],
	value: number | number[],
): string {
	if (Array.isArray(alter) && !Array.isArray(value)) return color;
	if (!Array.isArray(alter) && Array.isArray(value)) return color;
	if (Array.isArray(alter) && Array.isArray(value)) {
		alter.forEach((item: TColorAlteration, index: number) => {
			color = colorAlterColor(color, item, value[index]);
		});
		return color;
	}

	const colorOut = colorHexToColor(color);
	if (alter == "shift-saturation") {
		colorOut.saturation += Array.isArray(value) ? 0 : value;
		colorOut.saturation = Math.max(Math.min(colorOut.saturation, 1), 0);
	} else if (alter == "shift-brightness") {
		colorOut.brightness += Array.isArray(value) ? 0 : value;
		colorOut.brightness = Math.max(Math.min(colorOut.brightness, 1), 0);
	} else if (alter == "shift-hue") {
		colorOut.hue += Array.isArray(value) ? 0 : value;
		colorOut.brightness = Math.max(Math.min(colorOut.brightness, 360), 0);
		colorSetBase(colorOut);
	}
	colorOut.r = Math.round(
		colorOut.brightness *
			(255 * (1 - colorOut.saturation) + colorOut.saturation * colorOut.rBase),
	);
	colorOut.g = Math.round(
		colorOut.brightness *
			(255 * (1 - colorOut.saturation) + colorOut.saturation * colorOut.gBase),
	);
	colorOut.b = Math.round(
		colorOut.brightness *
			(255 * (1 - colorOut.saturation) + colorOut.saturation * colorOut.bBase),
	);
	return colorColorToHex(colorOut);
}

//--------------------------------------------------
//                    UTILS
//--------------------------------------------------
function colorSetBase(color: TColor) {
	const secondaryComponent = 1 - Math.abs(((color.hue / 60) % 2) - 1);

	if (color.hue < 60) [color.rBase, color.gBase, color.bBase] = [1, secondaryComponent, 0];
	else if (color.hue < 120) [color.rBase, color.gBase, color.bBase] = [secondaryComponent, 1, 0];
	else if (color.hue < 180) [color.rBase, color.gBase, color.bBase] = [0, 1, secondaryComponent];
	else if (color.hue < 240) [color.rBase, color.gBase, color.bBase] = [0, secondaryComponent, 1];
	else if (color.hue < 300) [color.rBase, color.gBase, color.bBase] = [secondaryComponent, 0, 1];
	else [color.rBase, color.gBase, color.bBase] = [1, 0, secondaryComponent];
	color.rBase = Math.trunc(color.rBase * 255);
	color.gBase = Math.trunc(color.gBase * 255);
	color.bBase = Math.trunc(color.bBase * 255);
}

export function colorHexToColor(hexa: string): TColor {
	if (hexa.charAt(0) != "#") hexa = "#" + hexa;
	const color: TColor = {
		r: parseInt(hexa.slice(1, 3), 16),
		g: parseInt(hexa.slice(3, 5), 16),
		b: parseInt(hexa.slice(5, 7), 16),

		rFloat: parseInt(hexa.slice(1, 3), 16) / 255,
		gFloat: parseInt(hexa.slice(3, 5), 16) / 255,
		bFloat: parseInt(hexa.slice(5, 7), 16) / 255,

		rBase: 0,
		gBase: 0,
		bBase: 0,

		major: "",
		majorValue: 0,
		minor: "",
		minorValue: 0,

		hue: 0,
		saturation: 0,
		brightness: 0,
	};

	//Major / Minor
	color.major = color.r >= color.g && color.r >= color.b ? "r" : color.g >= color.b ? "g" : "b";
	color.majorValue = color[`${color.major}Float` as keyof TColor] as number;
	color.minor = color.r <= color.g && color.r <= color.b ? "r" : color.g <= color.b ? "g" : "b";
	color.minorValue = color[`${color.minor}Float` as keyof TColor] as number;

	//Hue
	if (color.majorValue - color.minorValue == 0) color.hue = 0;
	else if (color.major == "r")
		color.hue = (color.gFloat - color.bFloat) / (color.majorValue - color.minorValue);
	else if (color.major == "g")
		color.hue = 2 + (color.bFloat - color.rFloat) / (color.majorValue - color.minorValue);
	else if (color.major == "b")
		color.hue = 4 + (color.rFloat - color.gFloat) / (color.majorValue - color.minorValue);
	color.hue *= 60;
	if (color.hue < 0) color.hue += 360;

	//BaseColor
	colorSetBase(color);

	//Saturation
	color.saturation =
		color.majorValue === 0 ? 0 : (color.majorValue - color.minorValue) / color.majorValue;

	//Brightness
	color.brightness = color.majorValue;
	return color;
}

export function colorColorToHex(color: TColor): string {
	return (
		"#" +
		(color.r.toString(16).length == 1 ? "0" : "") +
		color.r.toString(16) +
		(color.g.toString(16).length == 1 ? "0" : "") +
		color.g.toString(16) +
		(color.b.toString(16).length == 1 ? "0" : "") +
		color.b.toString(16)
	);
}
