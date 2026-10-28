from pydantic import BaseModel, EmailStr, Field


class ContactMessage(BaseModel):
    model_config = {"str_strip_whitespace": True}

    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    message: str = Field(min_length=10, max_length=5000)
    website: str = Field(default="", max_length=200)

class ProfileUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    role: str = Field(min_length=2, max_length=160)
    specialty: str = Field(min_length=2, max_length=200)
    location: str = Field(min_length=2, max_length=160)
    phone: str = Field(min_length=3, max_length=40)
    email: EmailStr
    intro: str = Field(min_length=10, max_length=1000)
    bio: str = Field(min_length=10, max_length=3000)
    availability: str = Field(min_length=2, max_length=160)
    positioning: str = Field(min_length=10, max_length=1000)
    socials: dict[str, str] = Field(default_factory=dict)
    highlights: list[dict[str, str]] = Field(default_factory=list)
    growth_areas: list[str] = Field(default_factory=list)
    opportunity_tracks: list[str] = Field(default_factory=list)

class Experience(BaseModel):
    company: str = Field(min_length=2, max_length=160)
    role: str = Field(min_length=2, max_length=200)
    type: str = Field(min_length=2, max_length=80)
    period: str = Field(min_length=2, max_length=100)
    summary: str = Field(default="", max_length=1000)
    description: str = Field(min_length=10, max_length=5000)
    sort_order: int = Field(default=0, ge=0, le=100000)
    tags: list[str] = Field(default_factory=list)

class Project(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    type: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=10, max_length=2000)
    tags: list[str] = Field(default_factory=list)
    link: str = Field(default="", max_length=500)
    caseStudy: str | None = Field(default=None, max_length=5000)
    accent: str = Field(default="blue", max_length=40)
    sort_order: int = Field(default=0, ge=0, le=100000)

class Education(BaseModel):
    qualification: str = Field(min_length=2, max_length=200)
    institution: str = Field(min_length=2, max_length=200)
    period: str = Field(min_length=2, max_length=100)
    detail: str = Field(default="", max_length=2000)
    sort_order: int = Field(default=0, ge=0, le=100000)

class Item(BaseModel):
    value: str = Field(min_length=1, max_length=200)

class Skill(BaseModel):
    value: str = Field(min_length=1, max_length=200)
    category: str = Field(default="Other", min_length=1, max_length=100)
