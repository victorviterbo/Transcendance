import { ttrn } from "../localization/localization";

export const capitalize = (value: string) => {
	return value.length === 0 ? value : `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}`;
};

export const formatPercentage = (value: number) =>
	`${ttrn(value, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	})}%`;

export const formatSeconds = (value: number) =>
	`${ttrn(value, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	})}s`;
