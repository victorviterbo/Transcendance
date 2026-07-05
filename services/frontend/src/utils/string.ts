export const capitalize = (value: string) => {
	return value.length === 0 ? value : `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}`;
};

export const formatPercentage = (ttrn: (value: number, options?: Intl.NumberFormatOptions) => string, value: number) =>
	`${ttrn(value, {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	})}%`;

export const formatSeconds = (ttrf: (id: string, params: Record<string, string>) => string, ttrn: (value: number, options?: Intl.NumberFormatOptions) => string, value: number) =>
	`${ttrf("SECONDS", {
		COUNT: ttrn(value, {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		}),
	})}`;
