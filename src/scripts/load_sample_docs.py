"""
Load sample documents into the Supabase database for Lexpert Case AI.
"""
import os
from pathlib import Path
from src.core.rag_pipeline import RAGPipeline
from src.config.settings import SAMPLE_DOCS_DIR

def load_sample_documents():
    """Load sample documents into the database."""
    print("Loading sample documents...")
    
    # Create sample docs directory if it doesn't exist
    os.makedirs(SAMPLE_DOCS_DIR, exist_ok=True)
    
    # Create a sample document if none exist
    if not list(SAMPLE_DOCS_DIR.glob("*.txt")):
        print("Creating sample document...")
        sample_doc_path = SAMPLE_DOCS_DIR / "texas_family_code_sample.txt"
        
        with open(sample_doc_path, "w") as f:
            f.write("""
Texas Family Code - Sample Excerpt

§ 153.002. BEST INTEREST OF CHILD.
The best interest of the child shall always be the primary consideration of the court in determining the issues of conservatorship and possession of and access to the child.

§ 153.003. NO DISCRIMINATION BASED ON SEX OR MARITAL STATUS.
The court shall consider the qualifications of the parties without regard to their marital status or to the sex of the party or the child in determining:
(1) which party to appoint as sole managing conservator;
(2) whether to appoint a party as joint managing conservator; and
(3) the terms and conditions of conservatorship and possession of and access to the child.

§ 153.004. HISTORY OF DOMESTIC VIOLENCE OR SEXUAL ABUSE.
(a) In determining whether to appoint a party as a sole or joint managing conservator, the court shall consider evidence of the intentional use of abusive physical force, or evidence of sexual abuse, by a party directed against the party's spouse, a parent of the child, or any person younger than 18 years of age committed within a two-year period preceding the filing of the suit or during the pendency of the suit.
(b) The court may not appoint joint managing conservators if credible evidence is presented of a history or pattern of past or present child neglect, or physical or sexual abuse by one parent directed against the other parent, a spouse, or a child, including a sexual assault in violation of Section 22.011 or 22.021, Penal Code, that results in the other parent becoming pregnant with the child.
            """)
        print(f"Created sample document at {sample_doc_path}")
    
    # Initialize RAG pipeline
    pipeline = RAGPipeline()
    
    # Process each document in the sample docs directory
    for doc_path in SAMPLE_DOCS_DIR.glob("*.txt"):
        print(f"Processing {doc_path.name}...")
        
        with open(doc_path, "r") as f:
            content = f.read()
        
        # Process document
        doc_id = pipeline.process_document(
            content=content,
            metadata={
                "title": doc_path.stem,
                "type": "example",
                "filename": doc_path.name
            }
        )
        
        print(f"Document processed with ID: {doc_id}")
    
    print("Sample documents loaded successfully.")

if __name__ == "__main__":
    load_sample_documents() 