from sqlalchemy import Column, Integer, String, Text
from app.core.database import Base
from app.models.base import TimestampMixin


class StoreSetting(Base, TimestampMixin):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)

    def __repr__(self):
        return f"<StoreSetting key='{self.key}'>"
