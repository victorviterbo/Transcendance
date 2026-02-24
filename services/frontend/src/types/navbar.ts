import type { ReactNode } from "react";
import type { MouseEvent } from "react";

export type TNavItem =
	| { kind: "link"; label: string; to: string; icon?: ReactNode }
	| {
			kind: "action";
			icon: ReactNode;
			aria: string;
			onClick: (event?: MouseEvent<HTMLElement>) => void;
			disabled?: boolean;
	  };
