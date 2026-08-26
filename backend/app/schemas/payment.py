from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class CreatePaymentOrderRequest(BaseModel):
    order_id: int


class CreatePaymentOrderResponse(BaseModel):
    key_id: str
    razorpay_order_id: str
    amount: int  # Amount in paise (e.g. 500.00 INR -> 50000)
    currency: str = "INR"
    order_id: int
    order_number: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class VerifyPaymentResponse(BaseModel):
    payment_id: str
    order_id: int
    order_number: str
    status: str
    amount: Decimal
    currency: str = "INR"
    method: Optional[str] = None


class RetryPaymentRequest(BaseModel):
    order_id: int


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    user_id: int
    provider: str
    provider_order_id: str
    provider_payment_id: Optional[str] = None
    amount: Decimal
    currency: str
    status: str
    method: Optional[str] = None
    signature_verified: bool
    failure_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class RefundCreateRequest(BaseModel):
    amount: Optional[Decimal] = Field(None, description="Amount to refund. If empty or None, full refundable balance is refunded.")
    reason: Optional[str] = "Customer requested refund / order modification"


class RefundResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    payment_id: int
    order_id: int
    provider_refund_id: Optional[str] = None
    amount: Decimal
    status: str
    reason: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
