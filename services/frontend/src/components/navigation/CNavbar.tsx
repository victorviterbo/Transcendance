import { AppBar, Box, IconButton, Menu, MenuItem, Stack, Toolbar } from "@mui/material";
import { useLocation, Link, useNavigate } from "react-router-dom";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PeopleIcon from "@mui/icons-material/People";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useState } from "react";
import { useAuth } from "../auth/CAuthProvider";
import { type TNavItem } from "../../types/navbar";
import logo from "../../assets/logo.svg";
import CTitle from "../text/CTitle.tsx";
import CNavbarLink from "./CNavbarLink.tsx";
import CNavbarIcon from "./CNavbarIcon.tsx";
import CDialogLanguage from "../feedback/dialogs/CDialogLanguage.tsx";
import CText from "../text/CText.tsx";

function CNavbar() {
	const { status, logout } = useAuth();
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
	const isProfileMenuOpen = Boolean(profileAnchor);

	const handleProfileOpen = (event?: React.MouseEvent<HTMLElement>) => {
		if (!event) return;
		setProfileAnchor(event.currentTarget);
	};

	const handleProfileClose = () => {
		setProfileAnchor(null);
	};

	const handleProfileNavigate = () => {
		handleProfileClose();
		navigate("/profile");
	};

	const handleLogout = async () => {
		handleProfileClose();
		logout();
	};

	const guestItems: TNavItem[] = [
		{ kind: "link", label: "Play", to: "/", icon: <SportsEsportsIcon /> },
		{ kind: "link", label: "Log in", to: "/auth" },
	];

	const authedItems: TNavItem[] = [
		{ kind: "link", label: "PLAY_GAME", to: "/", icon: <SportsEsportsIcon /> },
		{ kind: "link", label: "LEADERBOARD", to: "/leaderboard", icon: <LeaderboardIcon /> },
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
		{
			kind: "action",
			icon: <AccountCircleIcon />,
			aria: "Profile",
			onClick: handleProfileOpen,
		},
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
					<CDialogLanguage open={false} />
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
			<Menu anchorEl={profileAnchor} open={isProfileMenuOpen} onClose={handleProfileClose}>
				<MenuItem onClick={handleProfileNavigate}>
					<CText size="sm">MY_PROFILE</CText>
				</MenuItem>
				<MenuItem onClick={handleLogout}>
					<CText size="sm">LOGOUT</CText>
				</MenuItem>
			</Menu>
		</AppBar>
	);
}

export default CNavbar;
