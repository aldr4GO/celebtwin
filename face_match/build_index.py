import os
import numpy as np
from tqdm import tqdm

from config import *
from face_utils import extract_embedding
from index_utils import build_faiss_index, save_index
from concurrent.futures import ThreadPoolExecutor
from config import *
from face_utils import app
import numpy as np
import cv2



def load_identity_map():
    id_map = {}
    with open(CELEBA_IDENTITY_FILE) as f:
        for line in f:
            img, pid = line.strip().split()
            id_map[img] = int(pid)
    return id_map

def load_job(img_name):
    path = os.path.join(CELEBA_IMG_DIR, img_name)
    img = cv2.imread(path)
    if img is None:
        return None
    return img_name, cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def main():
    id_map = load_identity_map()
    # images = sorted(os.listdir(CELEBA_IMG_DIR))[:MAX_IMAGES]
    images = sorted(os.listdir(CELEBA_IMG_DIR))[:]

    embeddings = []
    image_paths = []
    identities = []

    with ThreadPoolExecutor(NUM_WORKERS) as pool:
        for result in tqdm(pool.map(load_job, images), total=len(images)):
            if result is None:
                continue

            img_name, img = result

            faces = app.get(img)
            if not faces:
                continue

            face = max(faces, key=lambda f: f.bbox[2] * f.bbox[3])
            emb = face.embedding
            emb = emb / np.linalg.norm(emb)

            embeddings.append(emb)
            image_paths.append(os.path.join(CELEBA_IMG_DIR, img_name))
            identities.append(id_map[img_name])

    embeddings = np.asarray(embeddings, dtype="float32")

    np.save(f"{ARTIFACT_DIR}/embeddings.npy", embeddings)
    np.save(f"{ARTIFACT_DIR}/image_paths.npy", image_paths)
    np.save(f"{ARTIFACT_DIR}/identities.npy", identities)

    index = build_faiss_index(embeddings)
    save_index(index, f"{ARTIFACT_DIR}/faiss.index")

    print(f"Indexed {len(embeddings)} faces")


if __name__ == "__main__":
    main()
