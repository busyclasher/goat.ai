"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MessageSquare, Sparkles, Plus, Zap } from "lucide-react";
import CreatePersonaModal from "@/components/CreatePersonaModal";
import { listPersonas } from "@/lib/personas";
import type { Persona } from "@/lib/supabase";

const suggestedQuestions = [
  "How do I get my first 1,000 customers?",
  "What's your best advice for entrepreneurs?",
  "How do I get better at strategy?",
  "What should I focus on in my 20s?",
];

// Helper function to get initials from a name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function LandingPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    const fetchedPersonas = await listPersonas();
    setPersonas(fetchedPersonas);
    if (fetchedPersonas.length > 0 && !selectedPersona) {
      setSelectedPersona(fetchedPersonas[0]);
    }
  };

  const handleStartChat = (slug: string, message?: string) => {
    const params = new URLSearchParams();
    params.set("persona", slug);
    if (message) {
      params.set("message", message);
    }
    router.push(`/chat?${params.toString()}`);
  };

  const handlePersonaCreated = (newPersona: Persona) => {
    // Refresh personas list
    fetchPersonas();

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Select the new persona
    setSelectedPersona(newPersona);
  };

  if (personas.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Goat AI</h1>
          </div>
          <p className="text-sm text-gray-600">Chat with AI Digital Minds</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-green-500" />
            <p className="text-green-700 font-medium">
              New persona created successfully!
            </p>
          </div>
        )}

        {/* Featured Persona */}
        {selectedPersona && (
          <div className="text-center mb-12">
            {selectedPersona.avatar_url ? (
              <div className="inline-block w-32 h-32 rounded-full overflow-hidden mb-6 shadow-xl">
                <Image
                  src={selectedPersona.avatar_url}
                  alt={selectedPersona.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-5xl font-bold mb-6 shadow-xl">
                {getInitials(selectedPersona.name)}
              </div>
            )}
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              {selectedPersona.name}
            </h2>
            <p className="text-xl text-gray-600 mb-4">{selectedPersona.system_prompt}</p>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleStartChat(selectedPersona.slug)}
                className="flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors shadow-lg"
              >
                <MessageSquare className="w-5 h-5" />
                Start Chat
              </button>
            </div>
          </div>
        )}

        {/* Suggested Questions */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Suggested Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleStartChat(selectedPersona?.slug || "", question)}
                className="w-full text-left px-6 py-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors flex items-center gap-3"
              >
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-900">{question}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Available Personas Grid */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Choose Your AI Mentor
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Create New Persona Card */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-gray-900 text-center mb-1">
                Create Persona
              </h4>
              <p className="text-xs text-gray-500 text-center">
                Add custom AI mentor
              </p>
            </button>

            {/* Existing Personas */}
            {personas.map((persona) => (
              <button
                key={persona.slug}
                onClick={() => setSelectedPersona(persona)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  selectedPersona?.slug === persona.slug
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {persona.avatar_url ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3">
                    <Image
                      src={persona.avatar_url}
                      alt={persona.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-500 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3">
                    {getInitials(persona.name)}
                  </div>
                )}
                <h4 className="font-semibold text-gray-900 text-center mb-1">
                  {persona.name}
                </h4>
                <p className="text-xs text-gray-500 text-center line-clamp-2">
                  {persona.system_prompt}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Create Persona Modal */}
        <CreatePersonaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handlePersonaCreated}
        />

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Powered by Groq AI • Voice by ElevenLabs
          </p>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>&copy; 2024 Goat AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
