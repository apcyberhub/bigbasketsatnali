from datetime import datetime, timezone
from sqlalchemy import Column, DateTime


def utc_now():
    return datetime.now(timezone.utc)


class TimestampMixin:
    """
    Mixin providing standard UTC timestamp columns for models.
    """
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
