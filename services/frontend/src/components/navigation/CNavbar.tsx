import { AppBar, Box, IconButton, Stack, Toolbar } from "@mui/material";
import { useLocation, Link } from "react-router-dom";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "../auth/CAuthProvider";
import { type TNavItem } from "../../types/navbar";
import logo from "../../assets/logo.svg";
import CTitle from "../text/CTitle.tsx";
import CNavbarLink from "./CNavbarLink.tsx";
import CNavbarIcon from "./CNavbarIcon.tsx";

function CNavbar() {
	const { status } = useAuth();
	const { pathname } = useLocation();

	const guestItems: TNavItem[] = [
		{ kind: "link", label: "Play", to: "/", icon: <SportsEsportsIcon /> },
		{ kind: "link", label: "Log in", to: "/auth" },
	];

	const authedItems: TNavItem[] = [
		{ kind: "link", label: "Play", to: "/", icon: <SportsEsportsIcon /> },
		{ kind: "link", label: "Leaderboard", to: "/leaderboard", icon: <LeaderboardIcon /> },
		{
			kind: "action",
			icon: <NotificationsIcon />,
			aria: "Notifications",
			onClick: () => alert("Coming soon"),
		},
		{
			kind: "action",
			icon: <PeopleIcon />,
			aria: "Friends",
			onClick: () => alert("Coming soon"),
		},
		{ kind: "action", icon: <AccountCircleIcon />, aria: "Profile", onClick: () => {} },
	];
	const items = status === "authed" ? authedItems : guestItems;

	return (
		<AppBar position="static">
			<Toolbar>
				<IconButton
					size="medium"
					edge="start"
					color="inherit"
					component={Link}
					to="/"
					aria-label="Home"
				>
					<Box component="img" src={logo} alt="Guess Tunes logo" sx={{ height: 40 }} />
				</IconButton>
				<CTitle size="sm" sx={{ flexGrow: 1 }}>
					Guess Tunes
				</CTitle>
				<Stack direction="row" spacing={2} alignItems="center">
					{items.map((item, idx) => {
						if (item.kind === "link") {
							const isActive =
								item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
							return (
								<CNavbarLink
									key={`${item.label}-${idx}`}
									to={item.to}
									label={item.label}
									icon={item.icon}
									active={isActive}
								/>
							);
						}

						return (
							<CNavbarIcon
								key={`${item.aria}-${idx}`}
								aria={item.aria}
								icon={item.icon}
								onClick={item.onClick}
								disabled={item.disabled}
							/>
						);
					})}
				</Stack>
			</Toolbar>
		</AppBar>
	);
}

export default CNavbar;
