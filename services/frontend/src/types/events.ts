export interface IEventStatus {
	valid: boolean;
	msg?: string;
	fieldErrors?: Record<string, string | string[]>;
}
