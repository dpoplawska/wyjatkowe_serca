from pydantic import BaseModel, EmailStr, Field, HttpUrl

class PaymentRequest(BaseModel):
    amount: int = Field(..., gt=1, description="The amount must be a positive integer greater than 1")
    email: EmailStr

class PaymentResponse(BaseModel):
    redirectUrl: HttpUrl
    paymentId: str
    status: str

