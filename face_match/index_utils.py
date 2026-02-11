import faiss
import numpy as np


def build_faiss_index(embeddings):
    if len(embeddings) == 0:
        raise ValueError("No embeddings to index.")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    return index


def save_index(index, path):
    """
    Saves FAISS index safely (CPU-only compatible).
    """
    faiss.write_index(index, path)


def load_index(path):
    return faiss.read_index(path)
