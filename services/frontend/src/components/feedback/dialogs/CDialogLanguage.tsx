import { useState } from "react";
import CButtonLanguage from "../../inputs/buttons/CButtonLanguage";
import CDialog, { type CDialogProps } from "./CDialog";
import CRadioGroup from "../../inputs/radio/CRadioGroup";
import { Box, DialogContent, DialogTitle } from "@mui/material";
import { currentLang, onLangChanged, ttr } from "../../../localization/localization";

export interface CDialogLanguageProps extends CDialogProps {}

function CDialogLanguage({ open, ...other }: CDialogLanguageProps) {
	//====================== STATE ======================
	const [isOpen, setIsOpen] = useState<boolean>(open);
	const [currentLangState, setCurrentLangState] = useState<string>(currentLang);

	//====================== DOM ======================
	return (
		<>
			<CButtonLanguage onClick={() => setIsOpen(true)} />
			<CDialog
				open={isOpen}
				onClose={() => {
					onLangChanged(currentLangState);
					setIsOpen(false);
				}}
				{...other}
			>
				<DialogContent>
					<Box>
						<DialogTitle>{ttr("LANG_SELECT")}</DialogTitle>
						<CRadioGroup
							defaultValue={currentLangState}
							options={[
								{ value: "en", label: "English" },
								{ value: "fr", label: "Français" },
								{ value: "jp", label: "日本語" },
							]}
							onChange={(_, value) => {
								setCurrentLangState(value);
							}}
						/>
					</Box>
				</DialogContent>
			</CDialog>
		</>
	);
}

export default CDialogLanguage;
