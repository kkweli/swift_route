"""LLM helpers for SwiftRoute - lightweight wrappers and stubs

This module provides a safe summarizer interface that will use an external LLM
if `GEMINI_API_KEY` is configured, otherwise it falls back to a deterministic
template-based summarizer to avoid sending coordinates or PII to external services.
"""

from .gemini_llm import summarize_candidates

__all__ = ["summarize_candidates"]
