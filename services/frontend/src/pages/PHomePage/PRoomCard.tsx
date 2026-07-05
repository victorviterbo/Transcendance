import GroupsIcon from "@mui/icons-material/Groups";
import { Box, Stack } from "@mui/material";
import type { IGameListEntry } from "../../types/game";
import type { CButtonProps } from "../../components/inputs/buttons/CButton";
import CButton from "../../components/inputs/buttons/CButton";
import CText from "../../components/text/CText";
import { MAX_PLAYERS, MUSIC_TAGS } from "../../constants";
import {
	PRoomCardButtonStyle,
	PRoomCardContentStyle,
	PRoomCardGenreStyle,
	PRoomCardGenreTextStyle,
	PRoomCardGenresStyle,
	PRoomCardHeaderStyle,
	PRoomCardNameStyle,
	PRoomCardPlayerCountStyle,
	PRoomCardPlayerIconStyle,
	PRoomCardPlayerTextStyle,
} from "../../styles/pages/home/PRoomCardStyle";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../components/layout/CLanguageProvider";

interface PRoomCardProps extends CButtonProps {
	infos: IGameListEntry;
}

function PRoomCard({ infos, ...other }: PRoomCardProps) {
	const selectedGenres = new Set(infos.genres);
	const playerCount = `${infos.players.length} / ${MAX_PLAYERS}`;
	const navigate = useNavigate();
	const { ttr } = useLang();

	return (
		<CButton
			onClick={() => navigate(`/game/${infos.uid}`)}
			sx={PRoomCardButtonStyle}
			{...other}
			data-testid={"PRoomCard"}
		>
			<Stack sx={PRoomCardContentStyle} spacing={1}>
				<Stack
					direction={{ xs: "column", tn: "row" }}
					spacing={1}
					alignItems="flex-start"
					sx={PRoomCardHeaderStyle}
				>
					<CText noTr={true} size="sm" sx={PRoomCardNameStyle}>
						{infos.name}
					</CText>
					<Stack
						direction="row"
						spacing={0.5}
						alignItems="center"
						sx={PRoomCardPlayerCountStyle}
					>
						<GroupsIcon sx={PRoomCardPlayerIconStyle} />
						<CText noTr={true} size="xs" sx={PRoomCardPlayerTextStyle}>
							{playerCount}
						</CText>
					</Stack>
				</Stack>

				<Box sx={PRoomCardGenresStyle}>
					{MUSIC_TAGS.map((genre) => {
						const isSelected = selectedGenres.has(genre);

						return (
							<Box key={genre} sx={PRoomCardGenreStyle(isSelected)}>
								<CText noTr={true} size="xs" sx={PRoomCardGenreTextStyle}>
									{ttr(genre)}
								</CText>
							</Box>
						);
					})}
				</Box>
			</Stack>
		</CButton>
	);
}

export default PRoomCard;
