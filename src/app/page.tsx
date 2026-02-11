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

interface CompareResponse {
  success: boolean;
  similarity_score?: number;
  match_percentage?: number;
  error?: string;
}

export default function Home() {
  const [tab, setTab] = useState<'search' | 'compare'>('search');
  
  // Search Tab States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  
  // Compare Tab States
  const [image1, setImage1] = useState<string | null>(null);
  const [file1, setFile1] = useState<File | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);
  
  // Common States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'image1' | 'image2' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection from device
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, imageNum?: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        
        if (tab === 'search') {
          setSelectedImage(imageData);
          setSelectedFile(file);
          setResults(null);
        } else if (tab === 'compare') {
          if (imageNum === 1) {
            setImage1(imageData);
            setFile1(file);
          } else {
            setImage2(imageData);
            setFile2(file);
          }
          setCompareResult(null);
        }
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Start camera capture
  const startCamera = async (mode: 'image1' | 'image2' | null = null) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      setShowCamera(true);
      setCameraMode(mode);
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

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.translate(canvas.width, 0);
      context.scale(-1, 1);

      context.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg');
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          
          if (tab === 'search') {
            setSelectedImage(imageData);
            setSelectedFile(file);
          } else if (tab === 'compare' && cameraMode) {
            if (cameraMode === 'image1') {
              setImage1(imageData);
              setFile1(file);
            } else {
              setImage2(imageData);
              setFile2(file);
            }
          }
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

  // Compare two faces
  const handleCompare = async () => {
    if (!file1 || !file2) {
      setError('Please select or capture both images');
      return;
    }

    setLoading(true);
    setError(null);
    setCompareResult(null);

    try {
      const formData = new FormData();
      formData.append('image1', file1);
      formData.append('image2', file2);

      const response = await fetch('/api/compare', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as CompareResponse;

      if (data.success) {
        setCompareResult(data);
      } else {
        setError(data.error || 'Failed to compare images');
      }
    } catch (err) {
      setError('Error communicating with server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">CelebTwin</h1>
          <p className="text-lg text-slate-300">
            Find your celebrity look-alike or compare faces using AI
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => {
              setTab('search');
              setError(null);
            }}
            className={`px-6 py-3 font-semibold rounded-lg transition ${
              tab === 'search'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            🔍 Search Celebrities
          </button>
          <button
            onClick={() => {
              setTab('compare');
              setError(null);
            }}
            className={`px-6 py-3 font-semibold rounded-lg transition ${
              tab === 'compare'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            👥 Compare Faces
          </button>
        </div>

        {/* Search Tab */}
        {tab === 'search' && (
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
                onChange={(e) => handleFileSelect(e)}
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
                      onClick={() => startCamera()}
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
                  className="w-full mt-6 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition"
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
        )}

        {/* Compare Tab */}
        {tab === 'compare' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image 1 Section */}
            <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Person 1
              </h2>

              {/* Image Preview */}
              {image1 && !showCamera && (
                <div className="mb-6">
                  <img
                    src={image1}
                    alt="Person 1"
                    className="w-full h-64 object-cover rounded-lg border-2 border-slate-600"
                  />
                </div>
              )}

              {/* Camera Preview */}
              {showCamera && cameraMode === 'image1' && (
                <div className="mb-6 space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 bg-black rounded-lg border-2 border-slate-600 scale-x-[-1]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Capture
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
                onChange={(e) => handleFileSelect(e, 1)}
                className="hidden"
              />

              {/* Action Buttons */}
              {!showCamera && (
                <div className="space-y-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    📁 Choose Photo
                  </button>
                  <button
                    onClick={() => startCamera('image1')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    📷 Take Photo
                  </button>
                </div>
              )}
            </div>

            {/* Image 2 Section */}
            <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Person 2
              </h2>

              {/* Image Preview */}
              {image2 && !showCamera && (
                <div className="mb-6">
                  <img
                    src={image2}
                    alt="Person 2"
                    className="w-full h-64 object-cover rounded-lg border-2 border-slate-600"
                  />
                </div>
              )}

              {/* Camera Preview */}
              {showCamera && cameraMode === 'image2' && (
                <div className="mb-6 space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 bg-black rounded-lg border-2 border-slate-600 scale-x-[-1]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Capture
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

              {/* File Input - using same ref but for image 2 */}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 2)}
                className="hidden"
                id="fileInput2"
              />

              {/* Action Buttons */}
              {!showCamera && (
                <div className="space-y-3">
                  <button
                    onClick={() => document.getElementById('fileInput2')?.click()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    📁 Choose Photo
                  </button>
                  <button
                    onClick={() => startCamera('image2')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                  >
                    📷 Take Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compare Results */}
        {tab === 'compare' && (image1 || image2) && (
          <div className="mt-8">
            {/* Compare Button */}
            {image1 && image2 && !showCamera && (
              <button
                onClick={handleCompare}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition text-lg mb-8"
              >
                {loading ? 'Comparing...' : '👥 Compare Faces'}
              </button>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-200 mb-8">
                {error}
              </div>
            )}

            {/* Results */}
            {compareResult && (
              <div className="bg-slate-800 rounded-lg p-8 shadow-lg text-center">
                <h2 className="text-3xl font-semibold text-white mb-6">
                  Similarity Score
                </h2>
                <div className="flex items-center justify-center gap-8">
                  {/* Similarity Meter */}
                  <div className="flex-1">
                    <div className="relative w-full h-64 bg-slate-700 rounded-lg flex items-center justify-center border-4 border-slate-600">
                      <div className="text-center">
                        <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                          {compareResult.match_percentage?.toFixed(1)}%
                        </div>
                        <div className="text-slate-300 text-lg mt-4">
                          {compareResult.match_percentage && compareResult.match_percentage > 70
                            ? '🔥 Very Similar!'
                            : compareResult.match_percentage && compareResult.match_percentage > 50
                            ? '👍 Similar'
                            : '📊 Some Similarity'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Text */}
                  <div className="flex-1">
                    <div className="bg-slate-700 rounded-lg p-6">
                      <p className="text-slate-200 text-lg mb-4">
                        These individuals share{' '}
                        <span className="text-cyan-400 font-bold">
                          {compareResult.match_percentage?.toFixed(1)}%
                        </span>{' '}
                        facial similarity
                      </p>
                      <p className="text-slate-400 text-sm">
                        {compareResult.match_percentage && compareResult.match_percentage > 70
                          ? 'These could be related or look very much alike!'
                          : compareResult.match_percentage && compareResult.match_percentage > 50
                          ? 'These faces share notable similar features'
                          : 'These faces have some similar characteristics'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
