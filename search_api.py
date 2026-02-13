#!/usr/bin/env python3
"""
API endpoint to perform face similarity search.
Receives image path and returns top_k similar faces.
"""

import sys
import json
import os
import numpy as np
import logging

# Suppress InsightFace and other library debug output
logging.basicConfig(level=logging.CRITICAL)
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Add face_match folder to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'face_match'))

from config import TOP_K, ARTIFACT_DIR, FAISS_SEARCH_K
from face_utils import extract_embedding
from index_utils import load_index

def search_similar_faces(image_path):
    """
    Search for similar faces in the database.
    
    Args:
        image_path: Path to the query image
        
    Returns:
        dict with results or error
    """
    try:
        # Extract embedding
        query_emb = extract_embedding(image_path)
        if query_emb is None:
            return {
                "success": False,
                "error": "Could not extract face from image"
            }
        
        # Load index and data
        index = load_index(f"face_match/{ARTIFACT_DIR}/faiss.index")
        identities = np.load(f"face_match/{ARTIFACT_DIR}/identities.npy")
        image_paths = np.load(f"face_match/{ARTIFACT_DIR}/image_paths.npy", allow_pickle=True)
        
        # Perform search with unique identity constraint
        D, I = index.search(query_emb.reshape(1, -1), FAISS_SEARCH_K)
        
        seen = set()
        results = []
        
        for idx, score in zip(I[0], D[0]):
            pid = identities[idx]
            if pid not in seen:
                seen.add(pid)
                results.append({
                    "image_path": str(image_paths[idx]),
                    "similarity_score": float(score)
                })
            if len(results) == TOP_K:
                break
        
        return {
            "success": True,
            "results": results,
            "query_image": image_path
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            result = {"error": "Image path required"}
            print(json.dumps(result))
            sys.exit(1)
        
        image_path = sys.argv[1]
        result = search_similar_faces(image_path)
        print(json.dumps(result))
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        # Ensure we always return valid JSON
        error_result = {"success": False, "error": f"Script error: {str(e)}"}
        print(json.dumps(error_result))
        sys.stdout.flush()
        sys.exit(1)
