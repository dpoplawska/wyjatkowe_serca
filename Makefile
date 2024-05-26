install:
	pipenv install --skip-lock

run:
	pipenv run uvicorn app.main:app --reload

run_dev:
	ENV=dev pipenv run uvicorn app.main:app --reload
