import { useState, type SyntheticEvent } from "react";
import { Button, Container, Tab, Tabs, Typography, Paper } from "@mui/material";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

type AuthUser = {
    id: number;
    username: string;
    email: string;
};

const AuthPage = () => {
    const [tab, setTab] = useState(0);
    const [authMessage, setAuthMessage] = useState<string | null>(null);

    const handleTabChange = (_: SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const buildWelcomeMessage = (user: AuthUser, mode: "login" | "register") => {
        const displayName = user.username || user.email;
        if (mode === "login") {
            return `Welcome back, ${displayName}!`;
        }
        return `Welcome, ${displayName}! Your account is ready.`;
    };

    const handleLoginSuccess = (user: AuthUser) => {
        setAuthMessage(buildWelcomeMessage(user, "login"));
    };

    const handleRegisterSuccess = (user: AuthUser) => {
        setAuthMessage(buildWelcomeMessage(user, "register"));
    };

    const handleReset = () => {
        setAuthMessage(null);
    };

    if (authMessage) {
        return (
            <Container maxWidth="sm">
                <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
                    <Typography variant="h4" align="center" gutterBottom>
                        Welcome
                    </Typography>
                    <Typography align="center" sx={{ mb: 3 }}>
                        {authMessage}
                    </Typography>
                    <Button variant="contained" fullWidth onClick={handleReset}>
                        Back to Auth
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    Welcome
                </Typography>

                <Tabs value={tab} onChange={handleTabChange} centered sx={{ mb: 3 }}>
                    <Tab label="Login" />
                    <Tab label="Register" />
                </Tabs>

                {tab === 0 && <LoginForm onSuccess={handleLoginSuccess} />}
                {tab === 1 && <RegisterForm onSuccess={handleRegisterSuccess} />}
            </Paper>
        </Container>
    );
};

export default AuthPage;
