import { Box, Stack } from "@mui/material";
import CImage from "../../components/images/CImage";
import CText from "../../components/text/CText";
import type { GPageProps } from "../common/GPageBases";
import type { IFriendInfo } from "../../types/friends";

interface PFriendNodeProps extends GPageProps {
	user: IFriendInfo;
}

function PFriendNode({ user }: PFriendNodeProps) {
	return (
		<Box>
			<Stack direction="row">
				<CImage></CImage>
				<CText>{user.name}</CText>
			</Stack>
		</Box>
	);
}

export default PFriendNode;
