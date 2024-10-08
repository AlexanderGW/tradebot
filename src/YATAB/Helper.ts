export type ParallelArray = {
	data: any[],
	dataIndex: string[],
};

export const isPercentage = (
	value: unknown
): boolean => {
	const string = String(value);
	return string.substring(string.length - 1) === '%'
};

export const countDecimals = (
	value: unknown
): number => {
	const string = String(value);
	const number = Number(value);
	if (Math.floor(number) == number)
		return 0;
	const result = string.split('.');
	return result.length === 2 ? result[1].length : 0;
};

export const toFixedNumber = (
	num: number,
	digits: number,
	base?: number,
): number => {
	const pow = Math.pow(base ?? 10, digits);
  return Math.round(num*pow) / pow;
};

// Unless miantains type context, not valuable.
export const indexLookup = (
	value: string,
	index: string[],
	data: any[],
): any | null => {
	const pos = index.indexOf(value);
	if (pos < 0)
		return null;

	return data[pos];
};