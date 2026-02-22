export type TField = {
	value: string;
	errors: string[];
};

export type TLoginFormState = {
	email: TField;
	password: TField;
};

export type TRegisterFormState = {
	username: TField;
	email: TField;
	password: TField;
	confirmPassword: TField;
};
