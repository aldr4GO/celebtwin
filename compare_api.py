#!/usr/bin/env python3
"""
Compare two face images and return similarity score.
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

from face_utils import extract_embedding

def compare_faces(image_path1, image_path2):
    """
    Compare two face images and return similarity score.
    
    Args:
        image_path1: Path to first image
        image_path2: Path to second image
        
    Returns:
        dict with similarity score or error
    """
    try:
        # Extract embeddings
        emb1 = extract_embedding(image_path1)
        emb2 = extract_embedding(image_path2)
        
        if emb1 is None or emb2 is None:
            return {
                "success": False,
                "error": "Could not extract face from one or both images"
            }
        
        # Calculate cosine similarity
        similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
        
        return {
            "success": True,
            "similarity_score": float(similarity),
            "match_percentage": float(similarity * 100)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    try:
        if len(sys.argv) < 3:
            result = {"error": "Two image paths required"}
            print(json.dumps(result))
            sys.exit(1)
        
        image_path1 = sys.argv[1]
        image_path2 = sys.argv[2]
        result = compare_faces(image_path1, image_path2)
        print(json.dumps(result))
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        # Ensure we always return valid JSON
        error_result = {"success": False, "error": f"Script error: {str(e)}"}
        print(json.dumps(error_result))
        sys.stdout.flush()
        sys.exit(1)
