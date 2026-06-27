import type { ReactNode } from "react";
import type { MouseEvent } from "react";

export type TNavItem =
	| { kind: "link"; label: string; to: string; icon?: ReactNode; hide?: boolean }
	| {
			kind: "action";
			icon: ReactNode;
			aria: string;
			onClick: (event?: MouseEvent<HTMLElement>) => void;
			disabled?: boolean;
	  }
	| {
			kind: "toggle";
			icon: ReactNode;
			aria: string;
			onClick: (event?: MouseEvent<HTMLElement>) => void;
			disabled?: boolean;
			active: boolean;
			notifCount?: number;
	  };
