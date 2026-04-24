from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, JSON
from sqlalchemy.sql import func
from .database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    date = Column(String, nullable=False)
    time = Column(String, nullable=True)
    duration = Column(Integer, nullable=True)
    location = Column(String, nullable=True)
    priority = Column(String, nullable=False)
    tags = Column(JSON, nullable=False, default=list)
    completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
