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
