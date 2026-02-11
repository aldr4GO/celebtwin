# CelebTwin - Full Stack Face Similarity Search

A full-stack web application that uses AI to find your celebrity look-alike by uploading or capturing an image and comparing it against a database of celebrity faces using FAISS (Facebook AI Similarity Search).

## Architecture

```
Frontend (Next.js + React)
    ↓
Next.js API Route (/api/search)
    ↓
Python Backend (search_api.py)
    ↓
Face Match Module (face_match/)
    ↓
FAISS Database Similarity Search
```

## Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **pip** (Python package manager)

## Setup Instructions

### 1. Install Node.js Dependencies

```bash
npm install
```

This installs the Next.js frontend dependencies.

### 2. Install Python Dependencies

```bash
cd face_match
pip install -r requirements.txt
cd ..
```

This installs the Python backend dependencies including:
- insightface (for face embeddings)
- faiss-cpu (for similarity search)
- opencv-python (for image processing)
- numpy (for numerical operations)

### 3. Prepare the FAISS Database

The face_match module expects the following files in `face_match/artifacts/`:
- `faiss.index` - FAISS index built from embeddings
- `embeddings.npy` - Face embeddings array
- `identities.npy` - Person IDs for each embedding
- `image_paths.npy` - Paths to images for each embedding

To build the index, run:
```bash
cd face_match
python build_index.py
cd ..
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Features

### Frontend
- **File Upload**: Upload images from your device
- **Camera Capture**: Take a photo using your device's camera
- **Real-time Preview**: See the selected image before searching
- **Top-K Results**: Display the 6 most similar faces with similarity scores

### Backend
- **API Endpoint**: `/api/search` (POST)
  - Accepts: multipart/form-data with image file
  - Returns: JSON with top similar faces and their paths

### Face Matching
- **Embedding Extraction**: Uses InsightFace for robust face embeddings
- **Similarity Search**: FAISS IndexFlatIP for fast k-nearest neighbor search
- **Identity Filtering**: Returns unique persons (no duplicates)

## API Documentation

### POST /api/search

**Request:**
```
Content-Type: multipart/form-data

{
  "image": <image file>
}
```

**Success Response (200):**
```json
{
  "success": true,
  "results": [
    {
      "image_path": "path/to/celebrity/image.jpg",
      "similarity_score": 0.75
    },
    ...
  ],
  "query_image": "path/to/uploaded/image.jpg"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Project Structure

```
celebtwin/
├── src/
│   └── app/
│       ├── page.tsx              # Main frontend component
│       ├── layout.tsx            # Layout wrapper
│       ├── globals.css           # Global styles
│       └── api/
│           └── search/
│               └── route.ts      # API endpoint
├── face_match/                   # Python backend (unchanged)
│   ├── face_utils.py            # Face embedding extraction
│   ├── index_utils.py           # FAISS index utilities
│   ├── config.py                # Configuration
│   ├── query.py                 # Search functionality
│   ├── build_index.py           # Index building
│   ├── artifacts/               # Model artifacts
│   │   ├── faiss.index
│   │   ├── embeddings.npy
│   │   ├── identities.npy
│   │   └── image_paths.npy
│   └── requirements.txt         # Python dependencies
├── search_api.py                # Python API wrapper
├── package.json                 # Node.js dependencies
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## Configuration

### Top-K Results
Edit `face_match/config.py` to change the number of results returned:
```python
TOP_K = 6  # Change this to return more/fewer results
```

### FAISS Search Parameters
```python
FAISS_SEARCH_K = 50  # Internal search pool size
```

## Troubleshooting

### "Could not extract face from image"
- Ensure the image contains a clear, front-facing face
- Try with a higher quality image
- Make sure the face is well-lit

### Python module not found errors
- Verify Python dependencies are installed: `pip install -r face_match/requirements.txt`
- Consider creating a virtual environment:
  ```bash
  python -m venv venv
  # Windows
  venv\Scripts\activate
  # macOS/Linux
  source venv/bin/activate
  ```

### FAISS index files not found
- Run `python face_match/build_index.py` to generate the index files
- Ensure `face_match/artifacts/` directory exists

### Camera not working
- Ensure the application is served over HTTPS in production
- Check browser permissions for camera access
- Some browsers require user interaction to access camera

## Performance Considerations

- **Embedding Extraction**: ~100-500ms per image (GPU accelerated if available)
- **FAISS Search**: <10ms for ~200,000 faces
- **Total Request Time**: ~200-700ms depending on system

## Future Enhancements

- Batch image search
- Face detection confidence filtering
- Results caching
- User registration and saved searches
- Real-time face detection in video stream

## License

[Add your license information]

## Support

For issues or questions, please open an GitHub issue or contact the development team.
