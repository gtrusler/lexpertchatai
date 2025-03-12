"""
RAG package for Lexpert Case AI.

This package implements the Retrieval-Augmented Generation functionality
for the Lexpert Case AI application.
"""

from .pipeline import process_query, process_document, auto_tag, get_prompt_coach

__all__ = ['process_query', 'process_document', 'auto_tag', 'get_prompt_coach'] 