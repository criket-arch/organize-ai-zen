from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: str
    time: Optional[str] = None
    duration: Optional[int] = None
    location: Optional[str] = None
    priority: str = Field(..., pattern="^(low|medium|high)$")
    tags: List[str] = Field(default_factory=list)
    completed: bool = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[int] = None
    location: Optional[str] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    tags: Optional[List[str]] = None
    completed: Optional[bool] = None


class TaskInDB(TaskBase):
    id: str
    createdAt: datetime = Field(..., alias="created_at")

    class Config:
        from_attributes = True
        populate_by_name = True
