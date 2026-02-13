import os

# Paths
CELEBA_IMG_DIR = "data/celeba/img_align_celeba"
CELEBA_IDENTITY_FILE = "data/celeba/identity_CelebA.txt"

ARTIFACT_DIR = "artifacts"

# Subset size (change later to full dataset)
MAX_IMAGES = 200000

# Face embedding
EMBEDDING_DIM = 512

# Search
TOP_K = 6
FAISS_SEARCH_K = 50  # retrieve more, then filter identities

# Performance
BATCH_SIZE = 32
NUM_WORKERS = 8
