import os

import firebase_admin
from firebase_admin import firestore
# from google.auth import credentials


def initialize_firestore():
    # don't initialize twice
    if len(firebase_admin._apps) > 0:
        return
    firebase_admin.initialize_app()


def get_firestore_client():
    initialize_firestore()
    # if os.getenv('FIRESTORE_EMULATOR_HOST'):
    #     return firestore.Client(
    #         project=os.getenv('FIRESTORE_PROJECT_ID'),
    #         credentials=credentials.AnonymousCredentials(),
    #     )
    return firestore.client()
