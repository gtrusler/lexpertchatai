from typing import Dict, List, Optional
import re

class PromptCoach:
    def __init__(self):
        """Initialize prompt coaching patterns and suggestions."""
        self._init_patterns()

    def _init_patterns(self):
        """Initialize prompt patterns and templates."""
        self.patterns = {
            "document_analysis": {
                "pattern": r"(summarize|analyze|review)\s+this",
                "suggestions": [
                    "Use [document] to summarize key points",
                    "Analyze [document] for [specific_aspect]",
                    "Review [document] and highlight [focus_area]"
                ]
            },
            "legal_drafting": {
                "pattern": r"draft\s+(a|an)?.*",
                "suggestions": [
                    "Draft [document_type] for [client], cite [law]",
                    "Create [document_type] based on [precedent]",
                    "Prepare [document_type] following [template]"
                ]
            },
            "law_citation": {
                "pattern": r"(cite|use)\s+(law|code|statute)",
                "suggestions": [
                    "Use [law] to support [argument]",
                    "Cite [statute] for [legal_point]",
                    "Apply [law] to [situation]"
                ]
            },
            "trademark": {
                "pattern": r"(trademark|office\s+action)",
                "suggestions": [
                    "Review [office_action] for [application]",
                    "Draft response to [office_action], cite [TMEP]",
                    "Analyze [trademark] under [section]"
                ]
            }
        }

    def analyze_prompt(self, prompt: str) -> Dict[str, List[str]]:
        """
        Analyze a user prompt and provide coaching suggestions.
        
        Args:
            prompt: User's input prompt
            
        Returns:
            Dict with matched categories and suggested improvements
        """
        prompt = prompt.lower().strip()
        matches = {}
        
        for category, data in self.patterns.items():
            if re.search(data["pattern"], prompt):
                matches[category] = data["suggestions"]
        
        return matches

    def get_structured_prompt(
        self,
        prompt: str,
        document_type: Optional[str] = None
    ) -> str:
        """
        Convert a casual prompt into a structured format.
        
        Args:
            prompt: User's input prompt
            document_type: Optional known document type
            
        Returns:
            Structured prompt suggestion
        """
        matches = self.analyze_prompt(prompt)
        
        if not matches:
            return prompt
        
        # Get the first matching category's first suggestion
        category = next(iter(matches))
        suggestion = matches[category][0]
        
        # Replace placeholders if document type is known
        if document_type:
            suggestion = suggestion.replace(
                "[document_type]",
                document_type
            )
            suggestion = suggestion.replace(
                "[document]",
                document_type
            )
        
        return suggestion

    def get_tooltip(self, prompt: str) -> Optional[str]:
        """
        Get a tooltip suggestion for the current prompt.
        
        Args:
            prompt: Current user input
            
        Returns:
            Tooltip text if suggestions available
        """
        matches = self.analyze_prompt(prompt)
        
        if not matches:
            return None
            
        # Get all unique suggestions
        suggestions = []
        for category_suggestions in matches.values():
            for suggestion in category_suggestions:
                if suggestion not in suggestions:
                    suggestions.append(suggestion)
        
        if not suggestions:
            return None
            
        tooltip = "Try structuring your prompt:\n"
        tooltip += "\n".join(f"• {s}" for s in suggestions[:3])
        
        return tooltip 