from pydantic import BaseModel, EmailStr, Field


class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    message: str

class ProfileUpdate(BaseModel):
    name: str
    role: str
    specialty: str
    location: str
    phone: str
    email: EmailStr
    intro: str
    bio: str
    availability: str
    positioning: str
    socials: dict[str, str] = Field(default_factory=dict)
    highlights: list[dict[str, str]] = Field(default_factory=list)
    growth_areas: list[str] = Field(default_factory=list)
    opportunity_tracks: list[str] = Field(default_factory=list)

class Experience(BaseModel):
    company: str
    role: str
    type: str
    period: str
    summary: str = ""
    description: str
    tags: list[str] = Field(default_factory=list)

class Project(BaseModel):
    title: str
    type: str
    description: str
    tags: list[str] = Field(default_factory=list)
    link: str = ""
    caseStudy: str | None = None
    accent: str = "blue"

class Education(BaseModel):
    qualification: str
    institution: str
    period: str
    detail: str = ""

class Item(BaseModel):
    value: str

class Skill(BaseModel):
    value: str
    category: str = "Other"
