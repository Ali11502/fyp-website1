import React, { useState, useEffect } from "react";
import { Bookmark, Loader2, AlertCircle, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useTask } from "../TaskContext";

const API_BASE = "http://localhost:8000";

export default function FlashcardsGenerator() {
  const { taskId } = useTask();

  const [fcTaskId, setFcTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [cards, setCards] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleGenerate = async () => {
    if (!taskId) {
      setError("Please process a video before generating flashcards.");
      return;
    }
    setError("");
    setIsGenerating(true);

    try {
      const res = await fetch(`${API_BASE}/api/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `HTTP ${res.status}`);
      }
      const { flashcards_task_id } = await res.json();
      setFcTaskId(flashcards_task_id);
      setStatus("processing");
    } catch (e) {
      setError(e.message);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!fcTaskId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/flashcards/status/${fcTaskId}`
        );
        const data = await res.json();
        setStatus(data.status);

        if (data.status === "completed") {
          clearInterval(interval);
          const cardsRes = await fetch(
            `${API_BASE}/api/flashcards/${fcTaskId}`
          );
          if (!cardsRes.ok) throw new Error(`HTTP ${cardsRes.status}`);
          const { cards } = await cardsRes.json();
          setCards(cards);
        }
        if (data.status === "failed") {
          clearInterval(interval);
          setError(data.error || "Flashcards generation failed.");
        }
      } catch (e) {
        clearInterval(interval);
        setError(e.message);
      } finally {
        setIsGenerating(false);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [fcTaskId]);

  const goToNextCard = () => {
    setCurrentCardIndex((prevIndex) => 
      prevIndex === cards.length - 1 ? prevIndex : prevIndex + 1
    );
  };

  const goToPrevCard = () => {
    setCurrentCardIndex((prevIndex) => 
      prevIndex === 0 ? prevIndex : prevIndex - 1
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-purple-100 p-3 rounded-full">
          <Bookmark className="h-8 w-8 text-purple-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Flashcards</h1>
          <p className="text-gray-600">{cards.length > 0 ? `${cards.length} flashcards to study` : "Generate interactive flashcards from your video."}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generate button */}
      {!fcTaskId && (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200 mb-6">
          <h2 className="text-3xl font-bold text-purple-700 mb-8">
            Ready to Enhance Your Learning?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-10 text-lg">
            Let our AI craft the perfect set of flashcards for your review.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg transition-colors shadow-md disabled:opacity-70 flex items-center gap-2 mx-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <RotateCw className="w-5 h-5" /> Create Flashcards
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading state */}
      {status === "processing" && fcTaskId && (
        <div className="bg-white border-2 border-purple-200 rounded-lg p-8 text-center mb-6 shadow-lg">
          <Loader2 className="w-12 h-12 mx-auto text-purple-500 animate-spin" />
          <h3 className="text-2xl font-bold text-purple-700 mt-4">
            Generating Flashcards
          </h3>
          <p className="text-gray-600 mt-2">
            Hang tight—your flashcards are on their way!
          </p>
        </div>
      )}

      {/* Flashcard View */}
      {status === "completed" && cards.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-3xl mb-6">
            <Flashcard 
              front={cards[currentCardIndex].front} 
              back={cards[currentCardIndex].back} 
            />
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center justify-between w-full max-w-3xl mt-6">
            <button 
              onClick={goToPrevCard} 
              disabled={currentCardIndex === 0}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-8 w-8 text-purple-600" />
            </button>
            
            <div className="text-gray-600 font-medium">
              {currentCardIndex + 1} / {cards.length}
            </div>
            
            <button 
              onClick={goToNextCard} 
              disabled={currentCardIndex === cards.length - 1}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-8 w-8 text-purple-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Flashcard({ front, back }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="cursor-pointer select-none w-full aspect-video relative"
    >
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out ${
          flipped ? "opacity-0 rotate-y-180" : "opacity-100"
        } rounded-xl bg-white border border-purple-200 shadow-md`}
      >
        <div className="flex items-center justify-center h-full p-8 text-center">
          <p className="text-xl sm:text-2xl font-medium text-gray-800">{front}</p>
        </div>
      </div>
      
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-500 ease-in-out ${
          flipped ? "opacity-100" : "opacity-0 rotate-y-180"
        } rounded-xl bg-purple-50 border border-purple-200 shadow-md`}
      >
        <div className="flex items-center justify-center h-full p-8 text-center">
          <p className="text-lg sm:text-xl text-gray-700">{back}</p>
        </div>
      </div>
    </div>
  );
}

// Add this CSS to your global styles for the card flip effect
/*
.rotate-y-180 {
  transform: rotateY(180deg);
}
*/