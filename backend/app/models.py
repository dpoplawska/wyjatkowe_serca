from pydantic import BaseModel, EmailStr, Field, HttpUrl


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
