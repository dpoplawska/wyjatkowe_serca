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
	cd frontend/app && npm run build && cd ../.. && firebase deploy --only hosting:wyjatkowe-serca-app --project=wyjatkowe-serca

deploy:
	$(MAKE) deploy-backend && $(MAKE) deploy-frontend

mobile-install:
	cd mobile && npm install

mobile-start:
	cd mobile && npx expo start

mobile-tunnel:
	cd mobile && npx expo start --tunnel

mobile-dev-backend:
	@echo "Starting backend in ENV=dev + public tunnel..."
	@echo "When the tunnel URL appears, paste it into mobile/app.json -> extra.apiUrl"
	@echo "then press 'r' in the Expo terminal to reload."
	@echo ""
	@(cd backend && ENV=dev GOOGLE_APPLICATION_CREDENTIALS=service-account.json pipenv run uvicorn app.main:app --reload) & \
	BACKEND_PID=$$!; \
	trap "kill $$BACKEND_PID 2>/dev/null" EXIT INT TERM; \
	sleep 3; \
	npx localtunnel --port 8000

mobile-ios:
	cd mobile && npx expo start --ios

mobile-android:
	cd mobile && npx expo start --android

mobile-typecheck:
	cd mobile && npx tsc --noEmit

mobile-doctor:
	cd mobile && npx expo-doctor
