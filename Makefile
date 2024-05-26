install:
	pipenv install --skip-lock

run:
	pipenv run uvicorn app.main:app --reload

run_dev:
	ENV=dev pipenv run uvicorn app.main:app --reload

build:
	docker build -t gcr.io/wyjatkowe-serca/backend ./backend
	docker build -t gcr.io/wyjatkowe-serca/frontend ./frontend
	docker push gcr.io/wyjatkowe-serca/backend
	docker push gcr.io/wyjatkowe-serca/frontend

deploy:
	gcloud run deploy backend --image gcr.io/wyjatkowe-serca/backend --platform managed --region YOUR_REGION --allow-unauthenticated
	gcloud run deploy frontend --image gcr.io/wyjatkowe-serca/frontend --platform managed --region YOUR_REGION --allow-unauthenticated
