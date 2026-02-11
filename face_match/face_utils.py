# import torch
# import cv2
# import numpy as np
# from facenet_pytorch import MTCNN, InceptionResnetV1

# device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# # Face detector
# mtcnn = MTCNN(image_size=160, margin=20, device=device)

# # Embedding model
# model = InceptionResnetV1(pretrained='vggface2').eval().to(device)


# def extract_embedding(img_path):
#     img = cv2.imread(img_path)
#     if img is None:
#         return None

#     img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

#     face = mtcnn(img_rgb)
#     if face is None:
#         return None

#     face = face.unsqueeze(0).to(device)

#     with torch.no_grad():
#         embedding = model(face)

#     return embedding.cpu().numpy()[0].astype("float32")

import cv2
import numpy as np
from mtcnn import MTCNN
from insightface.app import FaceAnalysis

detector = MTCNN()

app = FaceAnalysis(
    name="buffalo_l",
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"]
)
app.prepare(ctx_id=0, det_size=(640, 640))


def extract_embedding(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    faces = app.get(img_rgb)
    if not faces:
        return None

    # Largest face
    face = max(faces, key=lambda f: f.bbox[2] * f.bbox[3])

    emb = face.embedding
    return emb / np.linalg.norm(emb)
