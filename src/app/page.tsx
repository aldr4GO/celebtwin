'use client';

import { useState, useRef, useEffect} from 'react';

interface SearchResult {
  image_path: string;
  similarity_score: number;
}

interface SearchResponse {
  success: boolean;
  results?: SearchResult[];
  error?: string;
  query_image?: string;
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection from device
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setSelectedFile(file);
        setResults(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera capture
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      setError('Failed to access camera.');
    }
  };

 useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  }, [stream]);


  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Mirror horizontally
      context.translate(canvas.width, 0);
      context.scale(-1, 1);

      context.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg');
      setSelectedImage(imageData);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          setSelectedFile(file);
        }
      });

      stopCamera();
    }
  };

  // Stop camera capture
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  // Search for similar faces
  const handleSearch = async () => {
    if (!selectedFile) {
      setError('Please select or capture an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/search', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as SearchResponse;

      if (data.success && data.results) {
        setResults(data.results);
      } else {
        setError(data.error || 'Failed to search for similar faces');
      }
    } catch (err) {
      setError('Error communicating with server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">CelebTwin</h1>
          <p className="text-lg text-slate-300">
            Find your celebrity look-alike using AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Upload or Capture
              </h2>

              {/* Image Preview */}
              {selectedImage && !showCamera && (
                <div className="mb-6">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="w-full h-64 object-cover rounded-lg border-2 border-slate-600"
                  />
                </div>
              )}

              {/* Camera Preview */}
              {showCamera && (
                <div className="mb-6 space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 bg-black rounded-lg border-2 border-slate-600 scale-x-[-1]"
                    // className="w-full h-64 bg-black rounded-lg border-2 border-slate-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Action Buttons */}
              <div className="space-y-3">
                {!showCamera && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      📁 Choose from Device
                    </button>
                    <button
                      onClick={startCamera}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      📷 Use Camera
                    </button>
                  </>
                )}
              </div>

              {/* Search Button */}
              {selectedImage && !showCamera && (
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full mt-6 bg-linear-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  {loading ? 'Searching...' : '🔍 Find Similar Faces'}
                </button>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Top Results
            </h2>
            {results && results.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center space-y-2 p-3 bg-slate-700 rounded-lg"
                  >
                    {/* <div className="w-24 h-24 bg-slate-600 rounded-lg overflow-hidden flex items-center justify-center border border-slate-500">
                      <span className="text-slate-400 text-sm text-center px-2">
                        {result.image_path}
                        
                      </span>
                    </div> */}
                    <div className="w-24 h-24 bg-slate-600 rounded-lg overflow-hidden border border-slate-500">
                      <img
                        src={`/${result.image_path}`}
                        // src="data/celeba/img_align_celeba/009141.jpg"
                        alt={result.image_path}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-slate-200">
                        #{index + 1} Match
                      </div>
                      <div className="text-lg font-bold text-orange-400">
                        {(result.similarity_score * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results && results.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No matching results found
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                Select an image to search for similar faces
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Hidden Canvas for Camera Capture */}
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        className="hidden"
      />
    </div>
  );
}
