import spacy
from typing import Dict, List, Tuple
from ..config.settings import CONFIDENCE_THRESHOLD, SUPPORTED_TAGS

class DocumentTagger:
    def __init__(self):
        """Initialize the document tagger with spaCy model."""
        self.nlp = spacy.load("en_core_web_lg")
        self._init_patterns()

    def _init_patterns(self):
        """Initialize pattern matching rules for document classification."""
        self.patterns = {
            "petition": [
                "petition for divorce",
                "custody petition",
                "motion for temporary orders",
                "family court",
                "child support",
            ],
            "office_action": [
                "trademark",
                "office action",
                "registration number",
                "serial number",
                "likelihood of confusion",
                "section 2(d)",
                "TMEP",
            ],
            "example": [
                "example document",
                "sample case",
                "template",
                "demonstration",
            ]
        }

    def tag_document(self, text: str) -> Tuple[str, float]:
        """
        Tag a document with its most likely classification and confidence score.
        
        Args:
            text: Document text content
            
        Returns:
            Tuple of (tag, confidence_score)
        """
        # Preprocess text
        doc = self.nlp(text.lower())
        
        # Calculate similarity scores for each tag
        scores: Dict[str, float] = {}
        
        for tag, patterns in self.patterns.items():
            # Get maximum similarity score across all patterns
            pattern_scores = [
                max(token.similarity(self.nlp(pattern)) 
                    for token in doc)
                for pattern in patterns
            ]
            scores[tag] = max(pattern_scores) if pattern_scores else 0.0
        
        # Get tag with highest confidence
        best_tag = max(scores.items(), key=lambda x: x[1])
        tag, confidence = best_tag
        
        return tag, confidence

    def suggest_tags(self, text: str) -> List[Dict[str, float]]:
        """
        Get suggested tags with confidence scores above threshold.
        
        Args:
            text: Document text content
            
        Returns:
            List of dicts with tag and confidence score
        """
        doc = self.nlp(text.lower())
        suggestions = []
        
        for tag, patterns in self.patterns.items():
            pattern_scores = [
                max(token.similarity(self.nlp(pattern))
                    for token in doc)
                for pattern in patterns
            ]
            confidence = max(pattern_scores) if pattern_scores else 0.0
            
            if confidence >= CONFIDENCE_THRESHOLD:
                suggestions.append({
                    "tag": tag,
                    "confidence": confidence
                })
        
        return sorted(suggestions, 
                     key=lambda x: x["confidence"], 
                     reverse=True) 