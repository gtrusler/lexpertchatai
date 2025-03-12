from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
from typing import List, Optional
import random

app = FastAPI(title="Lexpert Case AI API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data for legal citations
LEGAL_CITATIONS = [
    "Texas §153.002, p. 2",
    "Texas Family Code §153.131",
    "Texas §153.134(a)",
    "Trademark Manual of Examining Procedure §1202.02",
    "15 U.S.C. §1052(e)(1)"
]

class MessageRequest(BaseModel):
    text: str
    botId: Optional[str] = None

class MessageResponse(BaseModel):
    text: str
    citation: Optional[str] = None

@app.get("/")
def read_root():
    return {"status": "Lexpert Case AI API is running"}

@app.post("/chat", response_model=MessageResponse)
async def chat(request: MessageRequest):
    """
    Process a chat message and return a response.
    Simulates a 3-5s response time for realistic AI processing.
    """
    if not request.text:
        raise HTTPException(status_code=400, detail="Message text cannot be empty")
    
    # Simulate processing time (3-5s)
    processing_time = random.uniform(3, 5)
    time.sleep(processing_time)
    
    # Generate a mock response
    response_text = f"Here's information related to your query about '{request.text}'. "
    
    # Add some legal context based on keywords
    if "custody" in request.text.lower():
        response_text += "In child custody cases, the court's primary consideration is the best interest of the child."
        citation = LEGAL_CITATIONS[0]
    elif "temporary" in request.text.lower():
        response_text += "Temporary orders can be issued to establish temporary custody, visitation, and support."
        citation = LEGAL_CITATIONS[1]
    elif "trademark" in request.text.lower():
        response_text += "Trademark applications must meet distinctiveness requirements and avoid likelihood of confusion."
        citation = LEGAL_CITATIONS[3]
    else:
        response_text += "Please provide more specific details about your legal question for a more targeted response."
        citation = random.choice(LEGAL_CITATIONS)
    
    return MessageResponse(text=response_text, citation=citation)

@app.get("/bots")
async def get_bots():
    """Return a list of available case bots"""
    return [
        {"id": "1", "name": "Weyl Bot", "description": "Family law case for Weyl", "lastActive": "2 hours ago"},
        {"id": "2", "name": "Trademark Bot", "description": "Trademark office action", "lastActive": "1 day ago"},
        {"id": "3", "name": "Holly vs. Waytt", "description": "CPS reports case", "lastActive": "3 days ago"},
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 