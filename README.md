# Transcendence

Transcendence is the last 42 Project of the Common Core curiculum
The project aims at developping a full stack website in teams of 4 or 5

# Run The Application

From a clean checkout, create the backend environment file:

```bash
cp services/backend/.env.example services/backend/.env
```

Edit `services/backend/.env` and set a real `SECRET_KEY`.

Then start the full application from a clean local state:

```bash
make fresh
```

This command:

- removes previous local containers, volumes, and SQLite database
- creates required runtime directories
- builds the backend and nginx/frontend images
- generates a local self-signed TLS certificate
- runs migrations and explicit demo seed commands
- starts backend and nginx

The app is then reachable at:

```text
https://localhost:4443
```

The browser will warn about the certificate because it is self-signed.

For normal restarts after the first setup, use:

```bash
make run
```

# Final Goal: TBD

# Project Structure
## Structure overview
<img width="1186" height="1453" alt="image" src="https://github.com/user-attachments/assets/93b1062f-8eba-4647-854a-bfd2020ab75a" />

## Backend-specific Overview
<img width="938" height="1138" alt="image" src="https://github.com/user-attachments/assets/43511e6e-238e-4fb0-a2b4-fbcebe043140" />

		
