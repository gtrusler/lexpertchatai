import os
from pathlib import Path
from typing import Dict
import io
import tempfile

from src.core.rag_pipeline import RAGPipeline
from src.core.auto_tagger import DocumentTagger
from src.core.prompt_coach import PromptCoach
from src.ui.components import setup_theme, chat_interface, file_uploader
from src.config.settings import SAMPLE_DOCS_DIR

def process_upload(
    file_content: bytes,
    filename: str,
    doc_type: str
) -> None:
    """Process an uploaded document."""
    try:
        # Save file to sample docs directory
        os.makedirs(SAMPLE_DOCS_DIR, exist_ok=True)
        file_path = SAMPLE_DOCS_DIR / filename
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Extract text content based on file type
        content = ""
        file_ext = Path(filename).suffix.lower()
        
        if file_ext == ".pdf":
            # Handle PDF files
            import PyPDF2
            with open(file_path, "rb") as f:
                pdf_reader = PyPDF2.PdfReader(f)
                for page_num in range(len(pdf_reader.pages)):
                    content += pdf_reader.pages[page_num].extract_text() + "\n"
        
        elif file_ext in [".doc", ".docx"]:
            # For Word documents, we'd need additional libraries
            # This is a placeholder - you might want to use python-docx
            content = f"Document content from {filename}"
        
        else:
            # For text files, read as text
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except UnicodeDecodeError:
                # If UTF-8 fails, try another encoding
                with open(file_path, "r", encoding="latin-1") as f:
                    content = f.read()
        
        # Auto-tag and process document
        tagger = DocumentTagger()
        tag, confidence = tagger.tag_document(content)
        
        # Use provided doc_type if confidence is low
        if confidence < 0.85:
            tag = doc_type
        
        # Process document with RAG pipeline
        pipeline = RAGPipeline()
        pipeline.process_document(
            content=content,
            metadata={
                "type": tag,
                "filename": filename,
                "title": Path(filename).stem
            }
        )
    except Exception as e:
        print(f"Error processing document: {e}")
        raise

def handle_chat(prompt: str) -> Dict:
    """Handle chat messages."""
    pipeline = RAGPipeline()
    return pipeline.query(prompt)

def main():
    """Main application entry point."""
    # Setup UI theme
    setup_theme()
    
    # Initialize components
    prompt_coach = PromptCoach()
    
    # Render UI
    file_uploader(process_upload)
    chat_interface(handle_chat, prompt_coach)

if __name__ == "__main__":
    main() 