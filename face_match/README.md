## Face Similarity Search (CelebA)

### Build index
python build_index.py

### Query
python query.py

pip install -r requirements.txt
conda install -c conda-forge numpy=1.26.4 faiss-cpu=1.7.4

faiss==1.7.4
nvidia-cufile-cu12==1.13.1.3

nvidia-nccl-cu11==2.21.5
nvidia-nccl-cu12==2.27.5

nvidia-nvshmem-cu12==3.3.20

tensorflow-io-gcs-filesystem==0.37.1