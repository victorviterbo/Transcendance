_This project has been created as part of the 42 curriculum by hcavet, vviterbo, fmixtur, kgauthie, yisho._

# ft_transcendence: Guess Tunes

## Description

### Project

Guess Tunes is a full-stack multiplayer web application built for the final project of the 42 Common Core. The application is centered around a real-time music quiz "blindtest" game where players join rooms, listen to track previews, guess the artist and title, compare scores, and build persistent profile progression.

The project combines a React single-page frontend, a Django backend, a SQLite database, WebSocket communication, HTTPS deployment through nginx, user accounts, profiles, friends, chat, notifications, localization, statistics, and game customization settings.

### Key Features

- User registration, login, logout, refresh-token authentication, and protected routes.
- Guest profiles and authenticated user profiles.
- Profile pages with avatar upload, username update, statistics, titles, match history, and progression.
- Friend requests, friends list, online status, and user discovery.
- Direct messages and in-game chat.
- Real-time WebSocket updates for social events, notifications, chat, and game state.
- Multiplayer music quiz rooms with public, friends-only, and private visibility.
- Game settings for genres, number of tracks, round duration, break duration, scoring mode, answer visibility, and fuzzy matching.
- Six music genres: pop, rock, rap, electro, French pop, and R&B.
- Persistent game statistics, leaderboards, XP, levels, titles, and match history.
- Frontend localization in English, French, Japanese, and German.
- Static Terms of Service, Privacy Policy, Contact, and Q&A pages.
- Dockerized deployment with nginx serving the frontend, static files, media files, API, and WebSocket proxy.

## Instructions

### Prerequisites

The project is intended to run through Docker.

Required tools:

- Docker with Docker Compose support.
- GNU Make.
- OpenSSL, used by the Makefile to generate the local self-signed HTTPS certificate.
- A modern browser. The mandatory target browser is the latest stable Google Chrome.

The application containers provide their own runtime dependencies:

- Frontend: Node.js 20, React 19, TypeScript, Vite, Material UI.
- Backend: Python 3.14, Django 6, Django REST Framework, Django Channels, Daphne.
- Database: SQLite, stored in a Docker volume.
- Web server: nginx.

### Environment Setup

Create the backend environment file from the example:

```bash
cp services/backend/.env.example services/backend/.env
```

Edit `services/backend/.env` and set a real `SECRET_KEY`:

```env
SECRET_KEY=<replace-with-a-secret-value>
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CSRF_TRUSTED_ORIGINS=https://localhost,https://localhost:4443
```

The local `.env` file must not be committed.

### Run From a Clean State

From the repository root:

```bash
make fresh
```

This command:

- removes previous local containers, volumes, images, and generated local TLS certificates;
- creates required runtime directories;
- builds the backend and nginx/frontend Docker images;
- generates a local self-signed TLS certificate;
- runs database migrations;
- seeds demo data and playlists;
- starts the backend and nginx containers.

The application is then available at:

```text
https://localhost
```

The browser will show a certificate warning because the certificate is self-signed for local development.

### Normal Restart

After the first setup:

```bash
make run
```

This rebuilds and starts the application without deleting the database volume.

### Useful Commands

| Command             | Purpose                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `make help`         | Show available Makefile commands.                                 |
| `make fresh`        | Full clean rebuild with fresh database and generated certificate. |
| `make run`          | Build and start the application while preserving volumes.         |
| `make down`         | Stop and remove containers.                                       |
| `make stop`         | Stop containers without removing them.                            |
| `make start`        | Start stopped containers.                                         |
| `make logs`         | Follow container logs.                                            |
| `make status`       | Show container status.                                            |
| `make backend-test` | Run backend tests inside the backend container.                   |

Frontend development commands are available from `services/frontend`:

```bash
npm install
npm run dev
npm run build
npm run lint
npm test -- --run
```

## Team Information

| 42 login | Name                | Assigned role(s)           |
| -------- | ------------------- | -------------------------- |
| hcavet   | Hugo Cavet          | Product Owner, Developer   |
| vviterbo | Victor Viterbo      | Tech Lead, Developer       |
| fmixtur  | Fabien Mixtur       | Project Manager, Developer |
| kgauthie | Kristopher Gauthier | Developer                  |
| yisho    | Yishan Ho           | Developer                  |

Suggested role definitions for this project:

### Responsibilities

- **hcavet (Product Owner, Developer)** - Defined product scope and feature priorities. Frontend: implemented authentication, user management, stats, footer pages and documentation. Infra: configured Makefile, Docker and Nginx.
- **vviterbo (Tech Lead, Developer)** - Coordinated architecture and technical decisions. Backend: implemented authentication, WebSocket, user management, stats and game.
- **fmixtur (Project Manager, Developer)** - Facilitated team coordination and organized meetings. Backend: implemented music module and game.
- **kgauthie (Developer)** - Frontend: implemented WebSocket, game, mocks, tests, social features, localization and styling.
- **yisho (Developer)** - Backend: implemented social features and notifications.

## Project Management

### Organization

The team distributed tasks based on each member's preferences, strengths, and learning goals. Some members were already more comfortable with frontend work, while others focused on backend features or had to spend time learning Python and Django before contributing fully to the implementation.

We tried to organize regular meetings to discuss progress, blockers, and integration work. However, because team members did not all have the same availability, it was difficult to maintain a strict sprint-planning process. Instead, the organization stayed flexible: tasks were assigned and adjusted progressively depending on availability, project priorities, and the areas each member was most comfortable taking ownership of.

Tasks were split by feature ownership and reviewed during integration. Branches and pull requests were used to isolate work before merging.

### Tools

- Git and GitHub for version control and code review.
- Notion for task tracking.
- Discord server with categorized channels and a webhook linked to the GitHub repository to receive updates and changes as notifications.
- Google Docs for TODO lists and bug reports.

## Technical Stack

### Frontend

- React 19 for the single-page application.
- TypeScript for typed frontend code.
- Vite for development and production builds.
- React Router for client-side routing.
- Material UI and Emotion for UI components and styling.
- Axios for HTTP API calls.
- `react-use-websocket` for WebSocket lifecycle handling.
- Vitest, Testing Library, MSW, and jsdom for frontend tests and mocks.

React was chosen because it is well suited to stateful interfaces with reusable components, live game state, protected routes, forms, and profile/social pages.

### Backend

- Django 6 for the backend application.
- Django REST Framework for HTTP API endpoints.
- Django Channels and Daphne for ASGI and WebSocket support.
- Simple JWT for access and refresh token authentication.
- Django ORM for database models and migrations.
- Pillow for avatar image validation and processing.
- RapidFuzz / TheFuzz / Levenshtein for fuzzy answer matching in the music quiz.

Django was chosen because it provides a strong ORM, authentication foundation, migrations, structured apps, admin support, and a stable base for combining REST APIs with WebSockets.

### Database

- SQLite is used as the project database.
- The database file is stored in the `backend-database` Docker volume at `/data/database/db.sqlite3`.
- SQLite was chosen because it is simple to deploy for the project scope, requires no external database service, and integrates directly with Django ORM migrations.

### Deployment and Infrastructure

- Docker Compose runs the backend and nginx services.
- nginx serves the built frontend, Django static files, uploaded media, REST API proxying, and WebSocket proxying.
- HTTPS is enabled locally with a self-signed certificate generated by the Makefile.
- Docker volumes persist the SQLite database and uploaded media.

## Database Schema

#TODO

## Features List

| Feature                    | Description                                                                                                                                                                                    | Team member(s)                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Authentication             | Registration, login, logout, protected routes, refresh cookie, JWT access token flow.                                                                                                          | hcavet, vviterbo                    |
| Guest profile support      | Allows non-authenticated users to use a guest profile before login.                                                                                                                            | vviterbo                            |
| Profile management         | Public profile, personal profile, username update, avatar upload, default avatars.                                                                                                             | hcavet, vviterbo                    |
| Friends system             | Friend requests, acceptance, friends list, online status, profile relationship actions.                                                                                                        | kgauthie, yisho                     |
| Direct chat                | Private rooms, persisted messages, delivered/seen state, real-time delivery.                                                                                                                   | kgauthie, yisho                     |
| Notifications              | App notifications for social events such as friend requests and accepted requests.                                                                                                             | kgauthie, yisho                     |
| Game room list             | Create, browse, and join public/friends/private music quiz rooms.                                                                                                                              | hcavet, vviterbo, fmixtur, kgauthie |
| Game customization         | Host settings for genres, track count, round timing, break timing, visibility, reveal mode, fuzzy matching, and score mode.                                                                    | vviterbo, fmixtur, kgauthie         |
| Multiplayer music quiz     | Real-time game rounds where players guess title and artist from audio previews.                                                                                                                | vviterbo, fmixtur, kgauthie         |
| In-game chat               | Game-room chat synchronized through WebSockets.                                                                                                                                                | kgauthie, yisho                     |
| Leaderboard                | Global ranking based on persistent user progression and game results.                                                                                                                          | hcavet, vviterbo                    |
| Statistics and history     | Profile statistics, match history, round details, XP, levels, and titles.                                                                                                                      | hcavet, vviterbo                    |
| Localization               | English, French, Japanese, and German localization with a language selector.                                                                                                                   | hcavet, kgauthie                    |
| Responsive UI system       | Shared layout, text, navigation, image, feedback, and surface components.                                                                                                                      | kgauthie                            |
| Custom design system       | Shared theme, color palette, typography rules, reusable layout components, navigation components, form components, profile/avatar components, feedback components, and game-specific surfaces. | kgauthie                            |
| Music data synchronization | Backend commands fetch and synchronize playlist/track data from external music sources, store track metadata and preview URLs, and make the data available to game rooms by genre.             | fmixtur                             |
| Docker deployment          | Containerized backend and nginx/frontend deployment with HTTPS.                                                                                                                                | hcavet                              |
| Tests and mocks            | Frontend tests, backend tests, mock API handlers, and validation-oriented checks.                                                                                                              | everyone                            |

## Game Rules and Settings

### Rules

- A player creates or joins a game room.
- The host can configure the game before it starts.
- Each round plays a music preview.
- Players submit guesses for the track title and artist.
- Correct answers award points and XP.
- In speed mode, faster correct answers are worth more.
- At the end of the configured number of tracks, the game finishes and results are saved.
- Player results contribute to profile statistics, match history, leaderboard position, XP, levels, and titles.

### Settings

| Setting            | Description                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Genres             | Selects which music categories can appear in the game: pop, rock, rap, electro, French pop, and R&B. |
| Visibility         | Controls who can find or join a room: public, friends-only, or private.                              |
| Track count        | Number of tracks/rounds in the game.                                                                 |
| Round duration     | Time available to answer during each music preview.                                                  |
| Break duration     | Time between rounds.                                                                                 |
| Score mode         | Normal mode or speed mode.                                                                           |
| Answers visibility | Controls whether answers are revealed to players.                                                    |
| Fuzzy matching     | Allows approximate artist/title answers so small typos can still be accepted.                        |

## Modules

Total claimed points: **21**.

| Module                                      | Type  | Points | Implementation                                                                                                                     | Team member(s)                    |
| ------------------------------------------- | ----- | -----: | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Use a frontend framework                    | Minor |      1 | React, TypeScript, Vite, React Router, component-based SPA.                                                                        | hcavet, kgauthie                  |
| Use a backend framework                     | Minor |      1 | Django, Django REST Framework, Django Channels, structured Django apps.                                                            | vviterbo, fmixtur, yisho          |
| Real-time features using WebSockets         | Major |      2 | WebSocket consumer for game events, chat, notifications, online state, and synchronized room updates.                              | everyone                          |
| Allow users to interact with other users    | Major |      2 | Profiles, friends, friend requests, direct chat, in-game chat, social profile actions.                                             | hcavet, vviterbo, kgauthie, yisho |
| Use an ORM for the database                 | Minor |      1 | Django ORM models, relationships, migrations, validators, and query APIs.                                                          | vviterbo, fmixtur, yisho          |
| Custom-made design system                   | Minor |      1 | Shared components for layout, navigation, text, images, feedback, surfaces, forms, and theme styling.                              | kgauthie                          |
| Support for multiple languages              | Minor |      1 | Localization CSV with English, French, Japanese, and German plus language switching.                                               | hcavet, kgauthie                  |
| Standard user management and authentication | Major |      2 | Account creation, login/logout, refresh token cookie, profile update, avatar upload, friends, online status.                       | hcavet, vviterbo                  |
| Game statistics and match history           | Minor |      1 | Persistent per-game and per-round stats, profile statistics panels, match history, leaderboard, XP.                                | hcavet, vviterbo                  |
| Complete web-based game                     | Major |      2 | Multiplayer music quiz with clear rounds, scoring, win/loss/result state, and persistent game results.                             | vviterbo, kgauthie, fmixtur       |
| Remote players                              | Major |      2 | Separate clients can join the same room and receive synchronized real-time gameplay over WebSockets.                               | everyone                          |
| Multiplayer game with more than two players | Major |      2 | Game rooms support more than two simultaneous players with shared leaderboard and synchronized state.                              | everyone                          |
| Game customization options                  | Minor |      1 | Host-configurable genres, visibility, track count, round duration, break duration, score mode, reveal answers, and fuzzy matching. | vviterbo, kgauthie, fmixtur       |
| Gamification system                         | Minor |      1 | Persistent XP, levels/progress, titles, leaderboard, match history, and profile progression feedback.                              | hcavet, vviterbo                  |
| Support for additional browsers             | Minor |      1 | Compatibility with Firefox and Brave                                                                                               | everyone                          |

## Individual Contributions

### hcavet / Hugo Cavet

Hugo worked mainly on frontend architecture, authentication integration, profile/statistics pages, API contract alignment, deployment tooling, and evaluation preparation.

Main areas:

- React/Vite frontend structure and shared frontend architecture.
- Authentication provider logic, protected routes, login/register flows, token refresh handling, and frontend auth tests/mocks.
- Profile pages, profile editing, avatar handling, validation helpers, leaderboard UI, statistics panels, and match history panels.
- Localization support across auth, profile, and static pages, with frontend API contracts kept aligned with backend changes.
- Static pages including Q&A, Contact, Terms of Service, and Privacy Policy.
- Docker, nginx, HTTPS, Makefile deployment commands, health checks, and evaluation documentation.

### vviterbo / Victor Viterbo

Victor worked mainly on backend architecture, authentication, profile/user modeling, database structure, statistics, WebSocket integration, and backend tests.

Main areas:

- Django backend structure and technical architecture.
- Custom user/profile split, JWT authentication, refresh-token rotation, logout behavior, and related tests.
- Profile update, password update, deletion, avatar/default-avatar, and guest/authenticated profile behavior.
- Database models and relations for users, profiles, friends, games, and statistics.
- Statistics and leaderboard backend endpoints.
- Game backend foundations, WebSocket event handling, database seeding, migrations, environment files, and backend test coverage.

### fmixtur / Fabien Mixtur

Fabien worked mainly on the music data module and the backend side of the game: game creation, game settings, answer validation, scoring, WebSocket game events, and game lifecycle behavior.

Main areas:

- Music module with playlist and track models.
- External music data synchronization, playlist seeding, track metadata, artwork, and audio preview handling.
- Game creation APIs, serializers, settings support, genre handling, and game UID based payloads.
- Backend game logic for rounds, answer validation, fuzzy matching, scoring, ranking, and game-end results.
- WebSocket game events such as settings updates, game start, round preview, answer broadcast, round end, game end, errors, and restart behavior.
- Backend tests around game creation, playlist generation, and game event behavior.

### kgauthie / Kristopher Gauthier

Kristopher worked mainly on the frontend design system, UI/UX, social screens, notification screens, game frontend, WebSocket UI integration, localization, and responsive layout cleanup.

Main areas:

- Reusable Material UI based components, layout components, typography components, navigation pieces, forms, drawers, and shared styling.
- Home page room creation, room joining, room listing, and related responsive behavior.
- Social frontend flows: friends list, friend requests, friend search/add, direct chat UI, social drawer, and notification drawer.
- Game frontend screens: lobby, settings, game chat, in-game leaderboard, round view, end view, answer feedback, point display, and game error/loading states.
- WebSocket-driven UI behavior and mock handlers for game/social flows.
- Mobile compatibility across home, profile, social, leaderboard, and game pages, including German text layout.

### yisho / Yishan Ho

Yishan worked mainly on backend social features, direct chat, game chat integration, WebSocket notifications, presence/online behavior, and friend-related backend adjustments.

Main areas:

- Private chat and direct-message behavior between users.
- Chat rooms, message persistence, delivery/seen behavior, and direct recipient lookup.
- WebSocket notification behavior for friend requests and social events.
- Chat integration inside game rooms, with game-chat payloads shaped for the frontend event format.
- Friend/social backend behavior, including remove-friend support and frontend-compatible response shapes.
- Chat and social tests aligned with WebSocket and payload protocol changes.

## Resources

### Documentation and Technical References

- 42 subject: `docs/en.subject.pdf`.
- Django documentation: https://docs.djangoproject.com/
- Django REST Framework documentation: https://www.django-rest-framework.org/
- Django Channels documentation: https://channels.readthedocs.io/
- Simple JWT documentation: https://django-rest-framework-simplejwt.readthedocs.io/
- React documentation: https://react.dev/
- React Router documentation: https://reactrouter.com/
- Vite documentation: https://vite.dev/
- TypeScript documentation: https://www.typescriptlang.org/docs/
- Material UI documentation: https://mui.com/material-ui/
- Docker documentation: https://docs.docker.com/
- nginx documentation: https://nginx.org/en/docs/
- SQLite documentation: https://www.sqlite.org/docs.html
- MDN Web Docs for browser APIs, forms, HTTP, cookies, WebSockets, and accessibility: https://developer.mozilla.org/

### AI Usage

AI tools were used during the development of this project for the following purposes:

- Understand the project stack and architecture.
- Review code.
- Assist with debugging.
- Help implement some functions.
- Documentation editing.

All generated suggestions were reviewed, tested, and adapted before being integrated into the project.

## Known Limitations

- The application is designed for local evaluation with a self-signed HTTPS certificate.
- SQLite is used intentionally for a simple single-service local deployment, for a real application we would want a stronger database.
- The WebSocket channel layer is in-memory, which is appropriate for a single backend container but not for horizontally scaled production deployment.
