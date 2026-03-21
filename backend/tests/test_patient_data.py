from unittest.mock import MagicMock, patch

from tests.conftest import mock_doc, mock_stream, dev_auth


PROFILE = {
    "imie_nazwisko": "Jan Kowalski",
    "grupa_krwi": "A+",
    "wada_serca": ["Kardiomiopatia"],
    "zaburzenia_rytmu": False,
    "zaburzenia_rytmu_typ": "",
    "zaburzenia_rytmu_opis": "",
    "rozrusznik_serca": False,
    "rozrusznik_serca_typ": "",
    "przebyte_operacje": [],
    "powiklania": False,
    "powiklania_opis": "",
    "dodatkowe_choroby": False,
    "dodatkowe_choroby_opis": "",
    "zespoly_genetyczne": False,
    "zespoly_genetyczne_typ": "",
    "zespoly_genetyczne_opis": "",
}


# ---------------------------------------------------------------------------
# GET /patient-profile
# ---------------------------------------------------------------------------

def test_get_patient_profile_returns_profile(client):
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = mock_doc(PROFILE)
    mock_db.collection().document().get.return_value.exists = True  # userAccess: not found → uid unchanged

    # userAccess doc (resolve_uid): doesn't exist
    no_access = mock_doc(None)
    profile_doc = mock_doc(PROFILE)
    mock_db.collection().document().get.side_effect = [no_access, profile_doc]

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/patient-profile", headers=dev_auth("uid-1"))

    assert res.status_code == 200
    assert res.json()["imie_nazwisko"] == "Jan Kowalski"


def test_get_patient_profile_not_found_returns_empty(client):
    no_access = mock_doc(None)
    missing_profile = mock_doc(None)
    mock_db = MagicMock()
    mock_db.collection().document().get.side_effect = [no_access, missing_profile]

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/patient-profile", headers=dev_auth())

    assert res.status_code == 200
    assert res.json() == {}


def test_get_patient_profile_no_auth(client):
    res = client.get("/patient-profile")
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# PUT /patient-profile
# ---------------------------------------------------------------------------

def test_upsert_patient_profile(client):
    no_access = mock_doc(None)
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = no_access

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.put("/patient-profile", json=PROFILE, headers=dev_auth())

    assert res.status_code == 200
    mock_db.collection().document().set.assert_called_once()


# ---------------------------------------------------------------------------
# GET & PUT /medications
# ---------------------------------------------------------------------------

def test_get_medications_returns_data(client):
    meds = {"leki": [{"id": "m1", "nazwa": "Aspiryna", "data_pierwszej_dawki": "", "godzina_pierwszej_dawki": "",
                      "czestotliwosc": "", "czas_trwania_typ": "", "czas_trwania_wartosc": 0,
                      "sledzenie": False, "ostatnia_dawka": "", "historia_dawek": [], "nastepna_dawka_override": ""}]}
    no_access = mock_doc(None)
    meds_doc = mock_doc(meds)
    mock_db = MagicMock()
    mock_db.collection().document().get.side_effect = [no_access, meds_doc]

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/medications", headers=dev_auth())

    assert res.status_code == 200
    assert res.json()["leki"][0]["nazwa"] == "Aspiryna"


def test_get_medications_empty(client):
    no_access = mock_doc(None)
    missing = mock_doc(None)
    mock_db = MagicMock()
    mock_db.collection().document().get.side_effect = [no_access, missing]

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/medications", headers=dev_auth())

    assert res.status_code == 200
    assert res.json() == {}


def test_upsert_medications(client):
    no_access = mock_doc(None)
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = no_access

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.put("/medications", json={"leki": []}, headers=dev_auth())

    assert res.status_code == 200
    mock_db.collection().document().set.assert_called_once()


# ---------------------------------------------------------------------------
# GET & PUT /inr
# ---------------------------------------------------------------------------

def test_get_inr_returns_entries(client):
    inr_data = {"entries": [{"id": "i1", "date": "2026-03-01", "inr": 2.5,
                              "pt": 30.0, "pt_normal": 12.0, "isi": 1.0, "note": ""}]}
    no_access = mock_doc(None)
    inr_doc = mock_doc(inr_data)
    mock_db = MagicMock()
    mock_db.collection().document().get.side_effect = [no_access, inr_doc]

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/inr", headers=dev_auth())

    assert res.status_code == 200
    assert res.json()["entries"][0]["inr"] == 2.5


def test_upsert_inr(client):
    no_access = mock_doc(None)
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = no_access

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.put("/inr", json={"entries": []}, headers=dev_auth())

    assert res.status_code == 200


# ---------------------------------------------------------------------------
# GET & PUT /measurements
# ---------------------------------------------------------------------------

def test_get_measurements_returns_entries(client):
    measurements = {"entries": [{"id": "m1", "date": "2026-03-01", "saturacja": 98.0,
                                  "tetno": 72.0, "cisnienie_skurczowe": 120.0,
                                  "cisnienie_rozkurczowe": 80.0, "diureza": None, "note": ""}]}
    no_access = mock_doc(None)
    m_doc = mock_doc(measurements)
    mock_db = MagicMock()
    mock_db.collection().document().get.side_effect = [no_access, m_doc]

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.get("/measurements", headers=dev_auth())

    assert res.status_code == 200
    assert res.json()["entries"][0]["tetno"] == 72.0


def test_upsert_measurements(client):
    no_access = mock_doc(None)
    mock_db = MagicMock()
    mock_db.collection().document().get.return_value = no_access

    with patch("app.routes.get_firestore_client", return_value=mock_db):
        res = client.put("/measurements", json={"entries": []}, headers=dev_auth())

    assert res.status_code == 200
