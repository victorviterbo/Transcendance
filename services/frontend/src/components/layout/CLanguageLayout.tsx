import { useState, type ReactNode } from "react";
import { currentLang, setOnLangChanged } from "../../localization/localization";

import React from "react";

interface CLanguageLayoutProps {
	children: ReactNode;
}

function CLanguageLayout({ children }: CLanguageLayoutProps) {
	const [lang, setLang] = useState<string>(currentLang);

	const onLangChanged = (): void => {
		setLang(currentLang);
	};
	setOnLangChanged(onLangChanged);

	return <React.Fragment key={lang}>{children}</React.Fragment>;
}

export default CLanguageLayout;
