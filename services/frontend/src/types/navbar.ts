import type { ReactNode } from "react";

export type TNavItem =
	| { kind: "link"; label: string; to: string; icon?: ReactNode }
	| { kind: "action"; icon: ReactNode; aria: string; onClick: () => void; disabled?: boolean };
