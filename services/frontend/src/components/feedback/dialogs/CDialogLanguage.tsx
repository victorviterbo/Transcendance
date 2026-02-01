import { useState } from "react";
import CButtonLanguage from "../../buttons/CButtonLanguage";
import CDialog, { type CDialogProps } from "./CDialog";
import CRadioGroup from "../../inputs/radio/CRadioGroup";
import { Box, DialogContent, DialogTitle } from "@mui/material";

export interface CDialogLanguageProps extends CDialogProps {
	
}

function CDialogLanguage({open, ...other}: CDialogLanguageProps) {
	
	//====================== STATE ======================
	var [isOpen, setIsOpen] = useState<boolean>(open);


	//====================== DOM ======================
	return <>
		<CButtonLanguage onClick={() => setIsOpen(true)}/>
		<CDialog open={isOpen} {...other}>
			<DialogContent>
				<Box>
					<DialogTitle>Language selection</DialogTitle>
					<CRadioGroup defaultValue="en" options={[
						{value: "en", label:"English"},
						{value: "fr", label:"Français"},
						{value: "jp", label:"日本語"},
					]}/>
				</Box>
			</DialogContent>
		</CDialog>
	</>
}

export default CDialogLanguage;