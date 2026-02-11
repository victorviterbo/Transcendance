import { useState, type ReactNode } from "react";
import { tr_currentLang, tr_setOnLangChanged } from "../../localization/localization";

import React from "react";

interface CLanguageLayoutProps {
	children: ReactNode;
}

function CLanguageLayout({children}: CLanguageLayoutProps) {

	const [lang, setLang] = useState<string>(tr_currentLang);

	let onLangChanged = (): void => {
		setLang(tr_currentLang);
	}
	tr_setOnLangChanged(onLangChanged);
	
	return <React.Fragment key={lang}>{children}</React.Fragment>;
}

export default CLanguageLayout;