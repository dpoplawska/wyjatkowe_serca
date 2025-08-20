from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import Optional


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
    email: EmailStr
    name: str = Field(..., description="Customer's full name")
    address: str = Field(..., description="Customer's shipping address")
    paczkomat: bool = Field(..., description="Whether to use Paczkomat delivery")
    paczkomat_id: Optional[str] = Field(None, description="Paczkomat ID if applicable")


class PurchaseResponse(BaseModel):
    redirectUrl: HttpUrl
    purchaseId: str
    status: str
