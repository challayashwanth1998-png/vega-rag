import requests
from bs4 import BeautifulSoup
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

def scrape_url_to_chunks(url: str, chunk_size=1000):
    """
    Downloads a webpage, extracts only the core readable text, 
    and splits it into chunks ready for Pinecone memory.
    """
    # Emulate browser to prevent blocking
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    # Parse HTML and extract raw text
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Remove script and style tags to clean up output
    for script in soup(["script", "style", "nav", "footer", "header"]):
        script.decompose()

    text = soup.get_text(separator=' ', strip=True)

    # LangChain split strategy (Ensure chunks overlap so context isn't lost across sentences)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=150,
        length_function=len,
    )
    
    chunks = text_splitter.split_text(text)
    
    # Format them as Langchain Documents with Metadata indicating where they came from
    documents = [
        Document(page_content=chunk, metadata={"source_url": url, "type": "webpage"})
        for chunk in chunks
    ]
    return documents
