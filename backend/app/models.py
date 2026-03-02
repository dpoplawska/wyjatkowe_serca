from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import Optional, List


class PaymentRequest(BaseModel):
    amount: int = Field(..., gt=0, description="The amount must be an integer greater than 0")
    email: EmailStr


class PaymentResponse(BaseModel):
    redirectUrl: HttpUrl
    paymentId: str
    status: str


class PaymentNotification(BaseModel):
    paymentId: str
    externalId: str
    status: str
    modifiedAt: str


class PurchaseRequest(BaseModel):
    amount: int = Field(..., gt=0, description="The total amount for the purchase")
    units: int = Field(..., gt=0, description="The number of units being purchased")
    email: EmailStr
    phone: str = Field(..., description="Customer's phone number")
    name: str = Field(..., description="Customer's full name")
    address: str = Field(..., description="Customer's shipping address")
    paczkomat: bool = Field(..., description="Whether to use Paczkomat delivery")
    paczkomat_id: Optional[str] = Field(None, description="Paczkomat ID if applicable")


class PurchaseResponse(BaseModel):
    redirectUrl: HttpUrl
    purchaseId: str
    status: str


class Operacja(BaseModel):
    typ: str = ""
    data: str = ""
    czas_it: str = ""


class PatientProfileData(BaseModel):
    imie_nazwisko: str = ""
    grupa_krwi: str = ""
    wada_serca: List[str] = []
    zaburzenia_rytmu: bool = False
    zaburzenia_rytmu_typ: str = ""
    zaburzenia_rytmu_opis: str = ""
    rozrusznik_serca: bool = False
    rozrusznik_serca_typ: str = ""
    przebyte_operacje: List[Operacja] = []
    powiklania: bool = False
    powiklania_opis: str = ""
    dodatkowe_choroby: bool = False
    dodatkowe_choroby_opis: str = ""
    zespoly_genetyczne: bool = False
    zespoly_genetyczne_typ: str = ""
    zespoly_genetyczne_opis: str = ""


class Lek(BaseModel):
    id: str = ""
    nazwa: str = ""
    data_pierwszej_dawki: str = ""
    godzina_pierwszej_dawki: str = ""
    czestotliwosc: str = ""
    czas_trwania_typ: str = ""
    czas_trwania_wartosc: int = 0
    sledzenie: bool = False


class MedicationsData(BaseModel):
    leki: List[Lek] = []
