from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
import re


class AddressBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    address_line1: str = Field(..., min_length=2, max_length=255, description="House/Flat/Building")
    address_line2: Optional[str] = Field("", max_length=255, description="Street/Area/Colony")
    landmark: Optional[str] = Field(None, max_length=255)
    city: str = Field("Satnali", max_length=100)
    state: str = Field("Haryana", max_length=100)
    pincode: str = Field(..., min_length=6, max_length=6)
    address_type: str = Field("home")
    is_default: bool = False

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        if not re.match(r"^\d{6}$", v):
            raise ValueError("Pincode must be a valid 6-digit numeric code")
        return v

    @field_validator("address_type", mode="before")
    @classmethod
    def normalize_address_type(cls, v: Optional[str]) -> str:
        if not v:
            return "home"
        v_clean = str(v).strip().lower()
        if v_clean not in ["home", "work", "other"]:
            return "home"
        return v_clean

    @field_validator("address_line2", mode="before")
    @classmethod
    def normalize_address_line2(cls, v: Optional[str]) -> str:
        if v is None:
            return ""
        return str(v).strip()


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    address_line1: Optional[str] = Field(None, min_length=2, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    landmark: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    address_type: Optional[str] = None
    is_default: Optional[bool] = None

    @field_validator("address_type", mode="before")
    @classmethod
    def normalize_update_address_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v_clean = str(v).strip().lower()
        return v_clean if v_clean in ["home", "work", "other"] else "home"



class AddressResponse(AddressBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
