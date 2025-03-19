"""
Chat service for handling message processing and responses.
"""
import logging
import random
import time
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Legal citations for mock responses
LEGAL_CITATIONS = [
    "Texas §153.002, p. 2",
    "Texas Family Code §153.131",
    "Texas §153.134(a)",
    "Trademark Manual of Examining Procedure §1202.02",
    "15 U.S.C. §1052(e)(1)"
]


def process_message(text: str, bot_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Process a chat message and return a response.
    Simulates a 3-5s response time for realistic AI processing.
    
    Args:
        text: The message text to process
        bot_id: Optional bot ID for context-specific responses
        
    Returns:
        Dict[str, Any]: Response with text and citation
    """
    if not text:
        logger.error("Empty message text received")
        return {
            "error": "Message text cannot be empty",
            "text": None,
            "citation": None
        }

    logger.info(f"Processing message for bot {bot_id}: {text[:50]}...")
    
    # Simulate processing time (3-5s)
    processing_time = random.uniform(3, 5)
    time.sleep(processing_time)

    # Generate a response based on message content
    response_text = f"Here's information related to your query about '{text}'."

    # Add some legal context based on keywords
    citation = None
    if "custody" in text.lower():
        response_text += " In child custody cases, the court's primary consideration is the best interest of the child."
        citation = LEGAL_CITATIONS[0]
    elif "temporary" in text.lower():
        response_text += " Temporary orders can be issued to establish temporary custody, visitation, and support."
        citation = LEGAL_CITATIONS[1]
    elif "trademark" in text.lower():
        response_text += " Trademark applications must meet distinctiveness requirements and avoid likelihood of confusion."
        citation = LEGAL_CITATIONS[3]
    else:
        response_text += " Please provide more specific details about your legal question for a more targeted response."
        citation = random.choice(LEGAL_CITATIONS)

    logger.info(f"Generated response with citation: {citation}")
    
    return {
        "text": response_text,
        "citation": citation
    }


def get_available_bots() -> List[Dict[str, Any]]:
    """
    Return a list of available case bots.
    
    Returns:
        List[Dict[str, Any]]: List of bot data
    """
    logger.info("Retrieving available bots")
    
    # In a real implementation, this would fetch from the database
    bots = [
        {"id": "1", "name": "Weyl Bot", "description": "Family law case for Weyl", "lastActive": "2 hours ago"},
        {"id": "2", "name": "Trademark Bot", "description": "Trademark office action", "lastActive": "1 day ago"},
        {"id": "3", "name": "Holly vs. Waytt", "description": "CPS reports case", "lastActive": "3 days ago"},
    ]
    
    logger.info(f"Retrieved {len(bots)} bots")
    return bots
