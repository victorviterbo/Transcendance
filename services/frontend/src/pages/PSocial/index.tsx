import { Stack } from "@mui/material";
import CTabs from "../../components/navigation/CTabs";
import CTitlePaper from "../../components/surfaces/CTitlePaper";
import CTextField from "../../components/inputs/textFields/CTextField";
import PFriendNode from "./PFriendNode";

function PSocial() {
	return (
		<CTitlePaper sx={{ flex: 1, marginBottom: "20px" }} title={"FRIEND_TITLE"}>
			<CTabs tabs={["FRIEND_LISTS", "FRIEND_REQUESTS"]}>
				<Stack>
					<CTextField></CTextField>
					<Stack>
						<PFriendNode user={{ name: "test", status: "online" }}></PFriendNode>
					</Stack>
				</Stack>
			</CTabs>
		</CTitlePaper>
	);
}

export default PSocial;
