import { useState } from "react";

export interface PersonalizationData {
  travelGroup: string;
  interests: string[];
  budget: string;
  priorities: string[];
}

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: PersonalizationData) => void;
}

const STEPS = [
  {
    key: "travelGroup",
    question: "Who are you traveling with?",
    type: "single",
    options: [
      { label: "Solo", emoji: "🧳" },
      { label: "Partner", emoji: "💑" },
      { label: "Family", emoji: "👨‍👩‍👧" },
      { label: "Friends", emoji: "👯" },
    ],
  },
  {
    key: "interests",
    question: "What type of trips interest you?",
    type: "multi",
    options: [
      { label: "Food", emoji: "🍜" },
      { label: "Anime", emoji: "⛩️" },
      { label: "Luxury", emoji: "✨" },
      { label: "Relaxation", emoji: "🧘" },
      { label: "Nightlife", emoji: "🌙" },
      { label: "Nature", emoji: "🌿" },
      { label: "Culture", emoji: "🎭" },
    ],
  },
  {
    key: "budget",
    question: "What's your budget style?",
    type: "single",
    options: [
      { label: "Budget", emoji: "💸", desc: "Smart spending, max experience" },
      { label: "Mid-range", emoji: "💳", desc: "Balanced comfort & value" },
      { label: "Luxury", emoji: "🛁", desc: "Premium everything" },
    ],
  },
  {
    key: "priorities",
    question: "What matters most to you?",
    type: "multi",
    options: [
      { label: "Saving money", emoji: "💰" },
      { label: "Hidden gems", emoji: "💎" },
      { label: "Structure", emoji: "📋" },
      { label: "Flexibility", emoji: "🌊" },
      { label: "Unique experiences", emoji: "🎯" },
    ],
  },
] as const;

export default function PersonalizationModal({ isOpen, onClose, onComplete }: PersonalizationModalProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<PersonalizationData>({
    travelGroup: "",
    interests: [],
    budget: "",
    priorities: [],
  });

  if (!isOpen) return null;

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  const handleSingleSelect = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleMultiSelect = (key: string, value: string) => {
    setData((prev) => {
      const arr = prev[key as keyof PersonalizationData] as string[];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const canProceed = () => {
    const val = data[currentStep.key as keyof PersonalizationData];
    return Array.isArray(val) ? val.length > 0 : val !== "";
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(data);
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gray-900 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-7">
          {/* Close */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-xs font-medium text-gray-400 tracking-wider uppercase">
              Tell us about yourself
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors text-gray-400"
            >
              ✕
            </button>
          </div>

          {/* Question */}
          <h2 className="text-xl font-bold text-gray-900 mb-5" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
            {currentStep.question}
          </h2>

          {/* Options */}
          <div className="flex flex-wrap gap-2 mb-8">
            {currentStep.options.map((opt) => {
              const val = data[currentStep.key as keyof PersonalizationData];
              const isSelected = Array.isArray(val) ? val.includes(opt.label) : val === opt.label;

              return (
                <button
                  key={opt.label}
                  onClick={() =>
                    currentStep.type === "single"
                      ? handleSingleSelect(currentStep.key, opt.label)
                      : handleMultiSelect(currentStep.key, opt.label)
                  }
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 text-sm font-medium transition-all duration-150 ${
                    isSelected
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  <span>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                canProceed()
                  ? "bg-gray-900 text-white hover:bg-gray-700 active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isLastStep ? "Show me my feed →" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
