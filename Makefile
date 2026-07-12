# Colors
GREEN			=	\033[0;32m
YELLOW			=	\033[1;33m
RED				=	\033[0;31m
BLUE			=	\033[0;34m
RESET			=	\033[0m

# Helper variables
NAME			=	ft_transcendence
ENV				=	COMPOSE_PROJECT_NAME=$(NAME)

# Commands
COMPOSE_COMMAND			=	docker compose -f
COMPOSE_FILE			=	./services/docker-compose.yml
CONDA_MANAGE_COMMAND	=	conda run --no-capture-output -n backend python /app/manage.py
CERTS_DIR				=	./services/nginx/certs
TLS_CERT				=	$(CERTS_DIR)/localhost.crt
TLS_KEY					=	$(CERTS_DIR)/localhost.key


# Base targets
all:		header run

$(NAME):	all

header:	# Display header
	echo "$(BLUE)======================================$(RESET)"
	echo "$(GREEN)     🚀 Starting ft_transcendence     $(RESET)"
	echo "$(BLUE)======================================$(RESET)"

fresh:	fclean dirs build certs prepare-db # Build and start app from a clean local state
	echo "$(YELLOW)⬆️  Starting containers...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) up -d
	echo "$(GREEN)✅ Containers are up!$(RESET)"

run:	dirs check-certs build prepare-playlists # Build and start app without reset, demo DB seeding, or certificate generation
	echo "$(YELLOW)⬆️  Starting containers...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) up -d
	echo "$(GREEN)✅ Containers are up!$(RESET)"

help:	# Display commands
	echo "$(BLUE)📌 Available commands:$(RESET)"
	grep -E '^[a-zA-Z_-]+ *:.*?#' Makefile | \
	awk 'BEGIN {FS=":.*?#"} {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'

# Docker targets
up:		# Build & start containers
	echo "$(YELLOW)⬆️  Bringing up containers...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) up -d --build
	echo "$(GREEN)✅ Containers are up!$(RESET)"

dirs:	# Create required local runtime directories
	echo "$(YELLOW)📁 Creating runtime directories...$(RESET)"
	mkdir -p $(CERTS_DIR)
	echo "$(GREEN)✅ Runtime directories ready$(RESET)"

build:	# Build Docker images
	echo "$(YELLOW)🏗️  Building images...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) build
	echo "$(GREEN)✅ Images built$(RESET)"

certs:	dirs # Generate local self-signed TLS certificate
	echo "$(YELLOW)🔐 Generating local TLS certificate...$(RESET)"
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout $(TLS_KEY) \
		-out $(TLS_CERT) \
		-subj "/CN=localhost" \
		-addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
	echo "$(GREEN)✅ Local TLS certificate generated$(RESET)"

check-certs:	dirs # Verify local TLS certificate files already exist
	echo "$(YELLOW)🔐 Checking local TLS certificate...$(RESET)"
	test -f $(TLS_CERT) || (echo "$(RED)Missing $(TLS_CERT). Run 'make certs' once.$(RESET)" && exit 1)
	test -f $(TLS_KEY) || (echo "$(RED)Missing $(TLS_KEY). Run 'make certs' once.$(RESET)" && exit 1)
	echo "$(GREEN)✅ Local TLS certificate found$(RESET)"

down:	# Stop & remove containers
	echo "$(YELLOW)⬇️ Taking down containers...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) down
	echo "$(RED)🛑 Containers are down$(RESET)"

stop:	# Stop containers without removing them
	echo "$(YELLOW)✋ Stopping containers...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) stop -t 3
	echo "$(RED)🛑 Containers stopped$(RESET)"

start:	# Start stopped containers
	echo "$(YELLOW)▶️  Starting containers...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) start
	echo "$(GREEN)✅ Containers started$(RESET)"

restart: stop start # Restart containers

kill:	# Force kill containers
	echo "$(RED)💀 Force-killing containers...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) kill
	echo "$(RED)☠️  All containers killed$(RESET)"

status:	# List running containers
	echo "$(BLUE)🔍 Container status:$(RESET)"
	docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

logs:	# Follow logs
	echo "$(BLUE)📜 Showing logs... Press Ctrl-C to exit$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) logs -f

clean:	# Remove containers and networks, preserving volumes, images and certs
	echo "$(YELLOW)🧹 Cleaning containers...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) down -t 3
	echo "$(GREEN)✨ Cleaned containers$(RESET)"

fclean:	# Remove containers, volumes, built images and local certs
	echo "$(RED)🧹 Fully cleaning containers, volumes, images and certs...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) down -v --rmi all -t 3
	rm -f $(TLS_CERT) $(TLS_KEY)
	echo "$(GREEN)✨ System fully cleaned$(RESET)"

re:		clean dirs check-certs up # Remove containers then rebuild and start, preserving volumes

fre:	fclean certs run # Fully clean, rebuild and start from a fresh local state

# Django targets
delete-migrations:	# Delete Django migration files, except migrations/__init__.py
	echo "$(RED)⚠️  Deleting Django migration files...$(RESET)"
	find ./services/backend -path "*/migrations/[0-9]*.py" -delete
	echo "$(GREEN)✅ Migration files deleted$(RESET)"

prepare-db:			# Migrate and seed the database before starting the app
	echo "$(YELLOW)🌱 Preparing fresh database...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) run --rm --entrypoint sh backend -c '$(CONDA_MANAGE_COMMAND) prepare_fresh_db'
	echo "$(GREEN)✅ Fresh database prepared$(RESET)"

prepare-playlists:	# Migrate and sync playlist data without demo user/game seeding
	echo "$(YELLOW)🎵 Preparing playlist data...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) run --rm --entrypoint sh backend -c '$(CONDA_MANAGE_COMMAND) migrate && $(CONDA_MANAGE_COMMAND) seed_playlists && $(CONDA_MANAGE_COMMAND) sync_playlists'
	echo "$(GREEN)✅ Playlist data prepared$(RESET)"

.SILENT:	all $(NAME) header help up dirs build certs check-certs down stop start kill status logs clean fclean re fre delete-migrations prepare-db prepare-playlists fresh run
.PHONY:		all $(NAME) header help up dirs build certs check-certs down stop start kill status logs clean fclean re fre delete-migrations prepare-db prepare-playlists fresh run
