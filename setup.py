from setuptools import setup, find_packages

setup(
    name="lexpertcaseai",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "langchain>=0.1.0",
        "langchain-community>=0.0.16",
        "openai>=1.12.0",
        "supabase>=2.0.0",
        "spacy>=3.7.2",
        "streamlit>=1.32.0",
        "redis>=5.0.1",
        "python-dotenv>=1.0.0",
        "anthropic>=0.8.0",
        "pydantic>=2.5.0",
        "pandas>=2.0.0",
        "numpy>=1.24.0",
        "python-magic>=0.4.27",
        "PyPDF2>=3.0.0",
        "tiktoken>=0.5.2",
        "faiss-cpu>=1.7.4"
    ],
    python_requires=">=3.9",
) 