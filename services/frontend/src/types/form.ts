export type TField = {
	value: string;
	errors: string[];
};

export type TFormState = {
	username: TField;
	email: TField;
	password: TField;
	confirmPassword: TField;
};
