# CelebTwin - Quick Start Guide

## What is CelebTwin?

CelebTwin is a full-stack web application that finds your celebrity look-alike. Upload a photo or take a selfie, and the app will search a database of celebrity faces to find the most similar ones using AI.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend API**: Next.js API Routes
- **ML Backend**: Python (InsightFace, FAISS)
- **Face Embeddings**: InsightFace (buffalo_l model)
- **Similarity Search**: FAISS (Facebook AI Similarity Search)

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
cd face_match
pip install -r requirements.txt
cd ..
```

### 2. Prepare the Database (if not already done)

```bash
# This builds the FAISS index from your image dataset
cd face_match
python build_index.py
cd ..
```

Make sure you have image files in `face_match/input/` before running build_index.py.

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Upload Image**: Click "📁 Choose from Device" to select an image
2. **Or Capture**: Click "📷 Use Camera" to take a photo with your camera
3. **Search**: Click "🔍 Find Similar Faces" to find matches
4. **View Results**: See the top 6 most similar celebrity faces with similarity scores

## Project Structure Overview

```
celebtwin/
├── src/app/
│   ├── page.tsx              ← Main UI (image upload + results)
│   └── api/search/route.ts   ← Backend API endpoint
├── face_match/               ← Python ML backend
│   ├── face_utils.py         ← Face embedding extraction
│   ├── build_index.py        ← Index building script
│   └── artifacts/            ← Model files (FAISS index, embeddings)
├── search_api.py             ← Python API wrapper
└── SETUP.md                  ← Detailed setup instructions
```

## Key Features

✨ **Upload or Capture**: Choose images from device or use camera
🔍 **AI Similarity Search**: Uses InsightFace for accurate embeddings
⚡ **Fast Results**: FAISS provides sub-100ms search
🎯 **Unique Results**: No duplicate person IDs in results
📱 **Responsive Design**: Works on desktop and mobile

## API Endpoint

### POST /api/search

Send an image and get similar matches:

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
    ...
  ]
}
```

## Troubleshooting

**"Could not extract face from image"**
- Make sure the image has a clear face
- Try a different photo

**"Python module not found"**
- Run: `pip install -r face_match/requirements.txt`
- Create a virtual environment: `python -m venv venv` then activate it

**FAISS index not found**
- Run: `cd face_match && python build_index.py`

**Camera permissions denied**
- Check browser camera permissions
- HTTPS required in production

## Production Deployment

```bash
npm run build
npm start
```

The app will run on the default port (3000) or the PORT environment variable.

## Performance Notes

- **Embedding**: 100-500ms (GPU accelerated if available)
- **Search**: <10ms for 200K faces
- **Total**: ~300-600ms per request

## Next Steps

1. Add your own celebrity image dataset to `face_match/input/`
2. Run `python face_match/build_index.py` to rebuild the index
3. Try uploading user photos to find matches!

## Support

Check SETUP.md for detailed configuration options and troubleshooting.

---

**Built with ❤️ using Next.js, Python, and FAISS**
