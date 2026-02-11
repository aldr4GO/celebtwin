# CelebTwin - Feature Guide

## Features Overview

CelebTwin has two main features:

### 1. 🔍 Search Celebrities
Find your celebrity look-alike by uploading or capturing your photo.

**How to use:**
1. Click the "🔍 Search Celebrities" tab
2. Upload an image from your device or take a photo with your camera
3. Click "🔍 Find Similar Faces"
4. View the top 6 most similar celebrity faces with similarity percentages

**Use case:** Discover which celebrities you look like!

---

### 2. 👥 Compare Faces
Compare two people to find how similar they look to each other.

**How to use:**
1. Click the "👥 Compare Faces" tab
2. Upload/capture the first person's photo
3. Upload/capture the second person's photo
4. Click "👥 Compare Faces"
5. View the similarity percentage

**Use cases:**
- Compare family members (father & son, mother & daughter, siblings)
- Check resemblance between two people
- Fun face comparisons with friends

---

## Technical Architecture

### Frontend (Next.js + React)
- **Search Tab**: Single image upload/capture with celebrity database search
- **Compare Tab**: Dual image input with face-to-face similarity calculation
- **Tab Navigation**: Easy switching between features
- **Real-time Preview**: See images before processing

### Backend API Routes

#### `/api/search` (POST)
Finds similar celebrity faces
- **Input**: Single image file
- **Output**: Top-K celebrity matches with similarity scores
- **Logic**: Embedding extraction → FAISS search → Unique person filtering

#### `/api/compare` (POST)
Compares two faces directly
- **Input**: Two image files
- **Output**: Similarity percentage
- **Logic**: Extract embeddings for both → Cosine similarity calculation

### Python Backend
- **search_api.py**: Similar face search wrapper
- **compare_api.py**: Face comparison wrapper
- **face_match/** folder: Core ML models (unchanged, untouched)
  - `face_utils.py`: Face embedding extraction using InsightFace
  - `index_utils.py`: FAISS index operations
  - `config.py`: Configuration constants

---

## Similarity Score Interpretation

For Compare feature:
- **> 70%**: Very similar (likely relatives or doppelgangers)
- **50-70%**: Similar (notable facial similarities)
- **< 50%**: Some similarity (fewer shared facial features)

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Main UI with both tabs
│   ├── layout.tsx                  # App layout
│   └── api/
│       ├── search/route.ts         # Search API endpoint
│       └── compare/route.ts        # Compare API endpoint
├── search_api.py                   # Search backend wrapper
├── compare_api.py                  # Compare backend wrapper (NEW!)
└── face_match/                     # ML backend (untouched)
    ├── face_utils.py
    ├── index_utils.py
    ├── config.py
    └── artifacts/
        ├── faiss.index
        ├── embeddings.npy
        ├── identities.npy
        └── image_paths.npy
```

---

## API Documentation

### POST /api/search
```bash
curl -X POST -F "image=@photo.jpg" http://localhost:3000/api/search
```

Response:
```json
{
  "success": true,
  "results": [
    {
      "image_path": "path/to/celeb1.jpg",
      "similarity_score": 0.85
    },
    {
      "image_path": "path/to/celeb2.jpg",
      "similarity_score": 0.82
    }
  ],
  "query_image": "temp/uploaded-image.jpg"
}
```

### POST /api/compare
```bash
curl -X POST \
  -F "image1=@person1.jpg" \
  -F "image2=@person2.jpg" \
  http://localhost:3000/api/compare
```

Response:
```json
{
  "success": true,
  "similarity_score": 0.768,
  "match_percentage": 76.8
}
```

---

## Key Improvements (Compare Feature)

✅ **Minimal Code**: Reused existing architecture
✅ **Dual Image Handling**: Efficient file management
✅ **Clean UI**: Easy tab switching
✅ **Real-time Preview**: Visual feedback for both images
✅ **Two Input Methods**: Upload or camera for each image
✅ **Cosine Similarity**: Mathematically accurate facial similarity
✅ **Error Handling**: Graceful error messages

---

## Performance

- **Face Extraction**: 100-500ms per image (with GPU acceleration)
- **Search**: <10ms for 200K faces (FAISS)
- **Compare**: ~500-600ms per comparison (2x extraction + calculation)
- **Total Search Request**: ~300-700ms
- **Total Compare Request**: ~600-1100ms

---

## Troubleshooting

### "Could not extract face from one or both images"
- Ensure clear, front-facing faces in both images
- Try higher quality images
- Ensure faces are well-lit
- Try photos with just one person per image

### Compare feature not working
- Both images must have detectable faces
- Try different image angles/qualities
- Check that both images were successfully uploaded

### Python module import errors
- Run: `cd face_match && pip install -r requirements.txt && cd ..`
- Or activate your virtual environment first

---

## Next Updates Ideas

- Batch comparisons
- Confidence filtering
- Search history
- Saved comparisons
- Real-time video comparison
- Side-by-side image viewer with highlighted similar features

