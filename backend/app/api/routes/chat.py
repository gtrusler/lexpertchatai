"""
API routes for chat operations.
"""
import logging
from fastapi import APIRouter, Body, HTTPException

from ...models.schemas import MessageRequest, MessageResponse
from ...services.chat_service import process_message, get_available_bots

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=MessageResponse)
async def chat(request: MessageRequest = Body(...)):
    """
    Process a chat message and return a response.

    Args:
        request: MessageRequest with text and optional botId

    Returns:
        MessageResponse: Response with text and citation
    """
    if not request.text:
        logger.error("Empty message text received")
        raise HTTPException(
            status_code=400, 
            detail="Message text cannot be empty")

    try:
        result = process_message(request.text, request.botId)

        if "error" in result:
            logger.error("Error processing message: %s", result['error'])
            raise HTTPException(status_code=400, detail=result["error"])
        return MessageResponse(
            text=result["text"],
            citation=result["citation"]
        )
    except Exception as e:
        logger.error("Error in chat endpoint: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/api/bots")
async def get_bots_endpoint():
    """
    Return a list of available case bots.

    Returns:
        Dict: Response with list of bots
    """
    try:
        bots = get_available_bots()
        logger.info("Retrieved %d bots", len(bots))
        return {"bots": bots}
    except Exception as e:
        logger.error("Error retrieving bots: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/bots")
async def get_bots():
    """
    Return a list of available case bots.

    Returns:
        List[Dict]: List of bot data
    """
    try:
        bots = get_available_bots()
        return bots
    except Exception as e:
        logger.error("Error retrieving bots: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e
