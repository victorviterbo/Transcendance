import { useState, type FormEvent } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";

const getErrorMessage = async (response: Response, fallback: string) => {
    try {
        const data = (await response.json()) as {
            error?: string;
            errors?: Record<string, string>;
        };
        if (data.error) {
            return data.error;
        }
        if (data.errors) {
            const messages = Object.values(data.errors).filter(Boolean);
            if (messages.length > 0) {
                return messages.join(", ");
            }
        }
        return fallback;
    } catch {
        return fallback;
    }
};

type AuthUser = {
    id: number;
    username: string;
    email: string;
};

type Props = {
    onSuccess?: (user: AuthUser) => void;
};

const LoginForm = ({ onSuccess }: Props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) {
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch(`/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const message = await getErrorMessage(response, "Login failed.");
                setError(message);
                return;
            }
            const user = (await response.json()) as AuthUser;
            console.log("Login success:", user);
            onSuccess?.(user);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleLogin}>
            <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />

            <TextField
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

            {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {error}
                </Typography>
            )}

            <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                disabled={isSubmitting}
            >
                {isSubmitting ? "Logging in..." : "Login"}
            </Button>
        </Box>
    );
};

export default LoginForm;
