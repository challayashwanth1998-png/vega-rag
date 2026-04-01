.PHONY: build up down logs deploy

# Local Development Commands
up:
	docker-compose up --build -d

down:
	docker-compose down

logs:
	docker-compose logs -f

build:
	docker-compose build

# Deployment Commands
deploy:
	./deploy.sh
