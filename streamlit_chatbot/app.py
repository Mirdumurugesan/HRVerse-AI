import os
import streamlit as st
from backend import load_pdfs, create_faiss_index, get_response

# Ensure the 'uploads' directory exists
os.makedirs("uploads", exist_ok=True)

# Streamlit UI
st.set_page_config(page_title="Chat with PDFs", page_icon="📄", layout="wide")

st.title("📄 Chat with your PDFs 🤖")
st.markdown("Upload your PDF documents and ask questions in plain English.")

st.divider()

# Sidebar for upload
with st.sidebar:
    st.header("📂 Upload Documents")
    uploaded_files = st.file_uploader(
        "Upload 5-10 PDFs",
        type=["pdf"],
        accept_multiple_files=True,
        help="Upload PDF files to build your knowledge base"
    )

    if st.button("⚙️ Process PDFs", use_container_width=True):
        if uploaded_files:
            pdf_paths = []
            with st.spinner("Processing PDFs... Please wait."):
                for uploaded_file in uploaded_files:
                    file_path = os.path.join("uploads", uploaded_file.name)
                    if not os.path.exists(file_path):
                        with open(file_path, "wb") as f:
                            f.write(uploaded_file.getbuffer())
                    pdf_paths.append(file_path)

                try:
                    chunks = load_pdfs(pdf_paths)
                    create_faiss_index(chunks)
                    st.success(f"✅ {len(uploaded_files)} PDF(s) processed! Ready to answer questions.")
                    st.info(f"📊 Created {len(chunks)} text chunks for search.")
                except Exception as e:
                    st.error(f"❌ Error: {e}")
        else:
            st.warning("⚠️ Please upload at least one PDF first.")

    st.divider()
    st.markdown("**How it works:**")
    st.markdown("1. Upload your PDFs")
    st.markdown("2. Click Process PDFs")
    st.markdown("3. Ask any question below")

# Main chat area
st.subheader("💬 Ask a Question")

query = st.text_input(
    "Type your question here:",
    placeholder="e.g. What is the leave policy for contract employees?"
)

if query:
    with st.spinner("🤖 Thinking..."):
        try:
            response = get_response(query)
            st.markdown("### 🤖 Answer:")
            st.write(response)
        except Exception as e:
            st.error(f"❌ Error generating answer: {e}")
