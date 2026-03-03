install:
	pipenv install --skip-lock

run:
	pipenv run uvicorn app.main:app --reload

run_dev:
	ENV=dev pipenv run uvicorn app.main:app --reload

run_frontend:
	cd frontend/app && npm start

dev:
	docker compose -f docker-compose.dev.yml up

dev-rebuild:
	docker compose -f docker-compose.dev.yml up --build

dev-rebuild-frontend:
	docker compose -f docker-compose.dev.yml up --build frontend

dev-rebuild-backend:
	docker compose -f docker-compose.dev.yml up --build backend

deploy-backend:
	gcloud run deploy wyjatkowe-serca --allow-unauthenticated --region europe-central2 --source ./backend/

deploy-frontend:
	gcloud run deploy wyjatkowe-serca-frontend --allow-unauthenticated --region europe-central2 --source ./frontend/

deploy:
	$(MAKE) deploy-backend && $(MAKE) deploy-frontend
