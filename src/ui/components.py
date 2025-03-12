import streamlit as st
from typing import Callable, Dict, List, Optional
import time

from src.config.settings import UI_THEME
from src.core.prompt_coach import PromptCoach

def setup_theme():
    """Configure the Streamlit theme."""
    st.set_page_config(
        page_title="Lexpert Case AI",
        page_icon="⚖️",
        layout="wide"
    )
    
    # Custom CSS for theme
    st.markdown(f"""
        <style>
        .stApp {{
            background-color: {UI_THEME["background_color"]};
            color: #333333;
        }}
        .stButton > button {{
            background-color: {UI_THEME["primary_color"]};
            color: white;
            border-radius: 4px;
            border: none;
            padding: 0.5rem 1rem;
            font-family: {UI_THEME["font_family"]};
        }}
        .stTextInput > div > div > input {{
            font-family: {UI_THEME["font_family"]};
            color: #333333;
        }}
        .source-footer {{
            color: gray;
            font-size: 0.8rem;
            margin-top: 0.5rem;
        }}
        .tooltip {{
            background-color: {UI_THEME["primary_color"]};
            color: white;
            padding: 0.5rem;
            border-radius: 4px;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }}
        /* Ensure text is visible in all containers */
        p, h1, h2, h3, h4, h5, h6, li, span, div {{
            color: #333333;
        }}
        /* Style chat messages */
        .stChatMessage {{
            background-color: {UI_THEME["card_color"]};
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 10px;
        }}
        .stChatMessage p {{
            color: #333333 !important;
        }}
        /* Style chat input */
        .stChatInput {{
            border-color: {UI_THEME["primary_color"]};
        }}
        /* Style sidebar */
        .css-1d391kg, .css-12oz5g7 {{
            background-color: {UI_THEME["background_color"]};
        }}
        </style>
    """, unsafe_allow_html=True)
    
    # Set default text color for the entire app
    st.markdown("""
        <style>
        body {
            color: #333333;
        }
        </style>
    """, unsafe_allow_html=True)

def chat_interface(
    on_submit: Callable[[str], Dict],
    prompt_coach: PromptCoach
):
    """
    Render the chat interface with prompt coaching.
    
    Args:
        on_submit: Callback for handling message submission
        prompt_coach: PromptCoach instance for suggestions
    """
    st.title("Lexpert Case AI")
    
    # Initialize chat history
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            # Add custom styling to ensure text is visible
            styled_content = f'<div style="color: #333333;">{message["content"]}</div>'
            st.markdown(styled_content, unsafe_allow_html=True)
            if "sources" in message:
                st.markdown(
                    f'<div class="source-footer">{message["sources"]}</div>',
                    unsafe_allow_html=True
                )
    
    # Chat input
    if prompt := st.chat_input("How can I help you?"):
        # Add user message
        st.session_state.messages.append({
            "role": "user",
            "content": prompt
        })
        
        with st.chat_message("user"):
            # Add custom styling to ensure text is visible
            styled_prompt = f'<div style="color: #333333;">{prompt}</div>'
            st.markdown(styled_prompt, unsafe_allow_html=True)
        
        # Get response
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                start_time = time.time()
                response = on_submit(prompt)
                end_time = time.time()
                
                # Add custom styling to ensure text is visible
                styled_answer = f'<div style="color: #333333;">{response["answer"]}</div>'
                st.markdown(styled_answer, unsafe_allow_html=True)
                
                if "sources" in response:
                    sources_text = "Sources:\n" + "\n".join(
                        f"• {s['metadata'].get('title', 'Document')}" +
                        (f", p. {s['metadata'].get('page', 'N/A')}" 
                         if 'page' in s['metadata'] else "")
                        for s in response["sources"]
                    )
                    st.markdown(
                        f'<div class="source-footer">{sources_text}</div>',
                        unsafe_allow_html=True
                    )
                
                response_time = end_time - start_time
                st.markdown(
                    f'<div class="source-footer">'
                    f'Response time: {response_time:.2f}s</div>',
                    unsafe_allow_html=True
                )
        
        # Add assistant message
        st.session_state.messages.append({
            "role": "assistant",
            "content": response["answer"],
            "sources": sources_text if "sources" in response else None
        })
    
    # Show prompt coaching tooltip
    if prompt and (tooltip := prompt_coach.get_tooltip(prompt)):
        st.markdown(
            f'<div class="tooltip">{tooltip}</div>',
            unsafe_allow_html=True
        )

def file_uploader(
    on_upload: Callable[[bytes, str, str], None]
):
    """
    Render the file upload interface.
    
    Args:
        on_upload: Callback for handling file uploads
    """
    st.sidebar.title("Document Upload")
    
    uploaded_file = st.sidebar.file_uploader(
        "Upload a document",
        type=["pdf", "txt", "doc", "docx"]
    )
    
    if uploaded_file:
        doc_type = st.sidebar.selectbox(
            "Document Type",
            ["petition", "office_action", "example"]
        )
        
        if st.sidebar.button("Process Document"):
            with st.spinner("Processing document..."):
                on_upload(
                    uploaded_file.read(),
                    uploaded_file.name,
                    doc_type
                )
            st.sidebar.success("Document processed successfully!") 