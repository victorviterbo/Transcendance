# Colors
GREEN			=	\033[0;32m
YELLOW			=	\033[1;33m
RED				=	\033[0;31m
BLUE			=	\033[0;34m
RESET			=	\033[0m

# Helper variables
NAME			=	transcendence
ENV				=	COMPOSE_PROJECT_NAME=$(NAME)

# Commands
RM						=	rm -rf
COMPOSE_COMMAND			=	docker compose -f
COMPOSE_FILE			=	./services/docker-compose.yml
CONDA_MANAGE_COMMAND	=	conda run --no-capture-output -n backend python /backend/manage.py
DB_FILE					=	./services/backend/DB/website/db.sqlite3
CERTS_DIR				=	./services/nginx/certs
TLS_CERT				=	$(CERTS_DIR)/localhost.crt
TLS_KEY					=	$(CERTS_DIR)/localhost.key


# Base targets
all:		header up

$(NAME):	all

header:		# Display header
	echo "$(BLUE)==============================$(RESET)"
	echo "$(GREEN)     🚀 Starting Inception     $(RESET)"
	echo "$(BLUE)==============================$(RESET)"

fresh:				fclean build certs prepare-db # Prepare a fresh database before starting the app
	echo "$(YELLOW)⬆️  Starting containers...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) up -d
	echo "$(GREEN)✅ Containers are up!$(RESET)"

help:		# Display commands
	echo "$(BLUE)📌 Available commands:$(RESET)"
	grep -E '^[a-zA-Z_-]+ *:.*?#' Makefile | \
	awk 'BEGIN {FS=":.*?#"} {printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'

# Docker targets
up:		# Build & start containers
	echo "$(YELLOW)⬆️  Bringing up containers...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) up -d --build
	echo "$(GREEN)✅ Containers are up!$(RESET)"

build:	# Build Docker images
	echo "$(YELLOW)🏗️  Building images...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) build
	echo "$(GREEN)✅ Images built$(RESET)"

certs:	# Generate local self-signed TLS certificate
	echo "$(YELLOW)🔐 Generating local TLS certificate...$(RESET)"
	mkdir -p $(CERTS_DIR)
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout $(TLS_KEY) \
		-out $(TLS_CERT) \
		-subj "/CN=localhost" \
		-addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
	echo "$(GREEN)✅ Local TLS certificate generated$(RESET)"

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

clean:	# Remove containers and volumes
	echo "$(YELLOW)🧹 Cleaning containers & volumes...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) down -v -t 3
	echo "$(GREEN)✨ Cleaned containers & volumes$(RESET)"

fclean:	clean # Remove containers, volumes and database
	echo "$(YELLOW)🧹 Removing local SQLite database...$(RESET)"
	$(RM) $(DB_FILE)
	echo "$(GREEN)✅ Database reset$(RESET)"
	echo "$(GREEN)✨ System fully cleaned$(RESET)"

re:		clean up # Remove containers and volumes then build them again

fre:	fclean up # Remove containers, volumes and database and build again

# Django targets
makemigrations:		# Generate migration files
	echo "$(YELLOW)🧬 Generating migration files...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) exec backend $(CONDA_MANAGE_COMMAND) makemigrations
	echo "$(GREEN)✅ Migration files generated$(RESET)"

check-migrations:	# Verify commited migrations match models
	echo "$(YELLOW)🔎 Checking migrations...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) exec backend $(CONDA_MANAGE_COMMAND) makemigrations --check --dry-run --noinput
	echo "$(GREEN)✅ Migrations match models$(RESET)"

migrate:			# Applies migrations
	echo "$(YELLOW)🗄️  Applying migrations...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) exec backend $(CONDA_MANAGE_COMMAND) migrate
	echo "$(GREEN)✅ Migrations applied$(RESET)"

prepare-db:			# Migrate and seed the database before starting the app
	echo "$(YELLOW)🌱 Preparing fresh database...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) run --rm --no-deps --entrypoint sh backend -c 'mkdir -p /backend/DB/website && $(CONDA_MANAGE_COMMAND) prepare_fresh_db'
	echo "$(GREEN)✅ Fresh database prepared$(RESET)"

backend-test:		# Run backend unit tests
	echo "$(YELLOW)▶️  Running backend tests...$(RESET)"
	$(ENV) $(COMPOSE_COMMAND) $(COMPOSE_FILE) run --rm --no-deps --entrypoint conda backend run --no-capture-output -n backend python /backend/manage.py test

.SILENT:	all $(NAME) header help up build certs down stop start kill status logs clean fclean re fre makemigrations migrate check-migrations prepare-db fresh backend-test
.PHONY:		all $(NAME) header help up build certs down stop start kill status logs clean fclean re fre makemigrations migrate check-migrations prepare-db fresh backend-test
