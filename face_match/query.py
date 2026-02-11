import numpy as np
import cv2
import matplotlib.pyplot as plt

from config import *
from face_utils import extract_embedding
from index_utils import load_index


def unique_identity_search(query_emb, index, identities, image_paths):
    D, I = index.search(query_emb.reshape(1, -1), FAISS_SEARCH_K)

    seen = set()
    results = []

    for idx, score in zip(I[0], D[0]):
        pid = identities[idx]
        if pid not in seen:
            seen.add(pid)
            results.append((image_paths[idx], score))
        if len(results) == TOP_K:
            break

    return results


def visualize(query_img, results, output_dir="output", show=True):
    os.makedirs(output_dir, exist_ok=True)

    fig = plt.figure(figsize=(15, 4))

    # Query image
    plt.subplot(1, len(results) + 1, 1)
    plt.imshow(cv2.cvtColor(cv2.imread(query_img), cv2.COLOR_BGR2RGB))
    plt.title("Query")
    plt.axis("off")

    # Results
    for i, (path, score) in enumerate(results):
        plt.subplot(1, len(results) + 1, i + 2)
        plt.imshow(cv2.cvtColor(cv2.imread(path), cv2.COLOR_BGR2RGB))
        plt.title(f"{score:.3f}")
        plt.axis("off")

    # Build output filename
    query_name = os.path.splitext(os.path.basename(query_img))[0]
    save_path = os.path.join(output_dir, f"{query_name}_top_matches.png")

    plt.tight_layout()
    plt.savefig(save_path, dpi=200, bbox_inches="tight")

    if show:
        plt.show()
    else:
        plt.close(fig)

    print(f"Saved result to: {save_path}")



def main():
    index = load_index(f"{ARTIFACT_DIR}/faiss.index")
    identities = np.load(f"{ARTIFACT_DIR}/identities.npy")
    image_paths = np.load(f"{ARTIFACT_DIR}/image_paths.npy", allow_pickle=True)

    names = ["query", "cropped", "original", "shahid"]
    for name in names:
        query_image = f"input/{name}.jpg"
        query_emb = extract_embedding(query_image)

        results = unique_identity_search(query_emb, index, identities, image_paths)
        visualize(query_image, results)


if __name__ == "__main__":
    main()
