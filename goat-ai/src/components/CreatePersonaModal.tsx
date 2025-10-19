"use client";

import { useState } from "react";
import { X, Loader2, Check, AlertCircle } from "lucide-react";
import type { Persona } from "@/lib/supabase";

interface CreatePersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (persona: Persona) => void;
}

export default function CreatePersonaModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePersonaModalProps) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [responseData, setResponseData] = useState<{
    customVoice?: boolean;
    voiceDescription?: string;
    persona: Persona;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/personas/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          query: query.trim() || undefined,
          gender: gender,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create persona");
      }

      // Log voice assignment
      console.log(
        "🎤 Voice assigned:",
        data.customVoice ? "Custom voice generated!" : `${data.gender === "female" ? "Sherry (female)" : "Roger (male)"} fallback`
      );
      if (data.voiceDescription) {
        console.log("Voice description:", data.voiceDescription);
      }

      setResponseData(data);
      setSuccess(true);

      // Wait a moment to show success state
      setTimeout(() => {
        onSuccess(data.persona);
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create persona. Please try again.");
      } else {
        setError("An unknown error occurred. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setQuery("");
    setGender("male");
    setError("");
    setSuccess(false);
    setIsLoading(false);
    setResponseData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Create New Persona
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Person&apos;s Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tim Ferriss, Marie Curie"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black placeholder:text-gray-600"
              disabled={isLoading || success}
              autoFocus
            />
          </div>

          {/* Gender Dropdown */}
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female")}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-black"
              disabled={isLoading || success}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Query Input (Optional) */}
          <div>
            <label
              htmlFor="query"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Additional Context (Optional)
            </label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., author, productivity expert"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-black placeholder:text-gray-600"
              disabled={isLoading || success}
            />
            <p className="text-xs text-gray-500 mt-1">
              Add keywords to help us find better information
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-5 h-5 text-green-500" />
                <p className="text-sm font-medium text-green-700">
                  {responseData?.customVoice
                    ? "Persona created with custom voice!"
                    : "Persona created successfully!"}
                </p>
              </div>
              {responseData?.voiceDescription && (
                <p className="text-xs text-gray-600 ml-7">
                  Voice: {responseData.voiceDescription}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || success}
            className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Persona...
              </>
            ) : success ? (
              <>
                <Check className="w-5 h-5" />
                Created!
              </>
            ) : (
              "Create Persona"
            )}
          </button>
        </form>

        {/* Info */}
        {!error && !success && !isLoading && (
          <p className="text-xs text-gray-500 text-center mt-4">
            We&apos;ll use Exa.ai to research and create a custom AI persona with
            unique voice
          </p>
        )}
        {isLoading && (
          <div className="text-center mt-4">
            <p className="text-xs text-gray-600 font-medium">
              Researching persona and generating custom voice...
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This may take 10-15 seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
