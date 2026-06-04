.PHONY: up down test logs build restart

up:
	docker compose up -d

down:
	docker compose down

test:
	docker compose exec app npm test

logs:
	docker compose logs -f app

build:
	docker compose build

restart: down up
