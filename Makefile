install:
	pipenv install --skip-lock

run:
	pipenv run uvicorn app.main:app --reload

run_dev:
	ENV=dev pipenv run uvicorn app.main:app --reload

deploy-backend:
	gcloud run deploy wyjatkowe-serca --allow-unauthenticated --region europe-central2 --source ./backend/

deploy-frontend:
	gcloud run deploy wyjatkowe-serca-frontend --allow-unauthenticated --region europe-central2 --source ./frontend/
