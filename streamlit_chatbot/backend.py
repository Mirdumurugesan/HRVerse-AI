import os
import google.generativeai as genai
import faiss
import pickle
import streamlit as st
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Initialize Gemini AI  ← BUG FIXED: was api_key="GOOGLE_API_KEY" (string literal)
genai.configure(api_key=GOOGLE_API_KEY)

# Function to load and split PDF text
def load_pdfs(pdf_files):
    documents = []
    for pdf_file in pdf_files:
        loader = PyPDFLoader(pdf_file)
        documents.extend(loader.load())

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)
    return chunks

# Function to create embeddings and store in FAISS
def create_faiss_index(chunks):
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(chunks, embeddings)

    # Save the FAISS index
    faiss.write_index(vectorstore.index, "vectorstore.index")
    with open("vectorstore.pkl", "wb") as f:
        pickle.dump(vectorstore, f)

# Function to load FAISS index
@st.cache_resource
def load_faiss_index():
    if os.path.exists("vectorstore.index") and os.path.exists("vectorstore.pkl"):
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        index = faiss.read_index("vectorstore.index")
        with open("vectorstore.pkl", "rb") as f:
            vectorstore = pickle.load(f)
        vectorstore.index = index
        return vectorstore
    return None

# Function to retrieve context from FAISS
def retrieve_context(query):
    vectorstore = load_faiss_index()
    if vectorstore:
        docs = vectorstore.similarity_search(query, k=3)
        context = "\n\n".join([doc.page_content for doc in docs])
        return context
    return "No relevant information found. Please upload and process PDFs first."

# Function to query Google Gemini AI
def query_gemini(prompt):
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content(prompt)
    return response.text

# Function to generate response
def get_response(query):
    context = retrieve_context(query)
    prompt = f"""You are a helpful assistant. Answer the question based ONLY on the context provided below.
If the answer is not in the context, say "I couldn't find relevant information in the uploaded documents."

Context:
{context}

Question: {query}

Answer:"""
    return query_gemini(prompt)
