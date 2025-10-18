"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Sparkles, Plus } from "lucide-react";
import CreatePersonaModal from "@/components/CreatePersonaModal";

const defaultPersonas = [
  {
    slug: "sherry-jiang",
    name: "Sherry Jiang",
    title: "Startup Founder & AI Enthusiast",
    avatar: "S",
    color: "bg-pink-500",
    description: "Real advice from a founder building in public",
  },
  {
    slug: "warrenbuffett",
    name: "Warren Buffett",
    title: "Investment Wisdom & Long-term Thinking",
    avatar: "W",
    color: "bg-blue-500",
    description: "Learn about value investing and business fundamentals",
  },
  {
    slug: "elonmusk",
    name: "Elon Musk",
    title: "Innovation & Bold Vision for the Future",
    avatar: "E",
    color: "bg-purple-500",
    description: "Discuss technology, sustainability, and ambitious goals",
  },
  {
    slug: "stevejobs",
    name: "Steve Jobs",
    title: "Design Excellence & User Experience",
    avatar: "J",
    color: "bg-gray-700",
    description: "Explore product design and creative thinking",
  },
  {
    slug: "naval",
    name: "Naval Ravikant",
    title: "Wealth Creation & Philosophy",
    avatar: "N",
    color: "bg-indigo-500",
    description: "Insights on building wealth and finding happiness",
  },
  {
    slug: "raydalio",
    name: "Ray Dalio",
    title: "Principles-based Thinking",
    avatar: "R",
    color: "bg-green-600",
    description: "Learn about systems, patterns, and decision-making",
  },
  {
    slug: "mentor",
    name: "Mentor",
    title: "General Practical Advice",
    avatar: "M",
    color: "bg-orange-500",
    description: "Get actionable guidance on various topics",
  },
];

const suggestedQuestions = [
  "How do I get my first 1,000 customers?",
  "What's your best advice for entrepreneurs?",
  "How do I get better at strategy?",
  "What should I focus on in my 20s?",
];

export default function LandingPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState(defaultPersonas);
  const [selectedPersona, setSelectedPersona] = useState(defaultPersonas[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch personas from database on mount
  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const response = await fetch("/api/personas");
      const data = await response.json();

      if (data.success && data.personas.length > 0) {
        // Map database personas to display format
        const dbPersonas = data.personas.map((p: any, index: number) => ({
          slug: p.slug,
          name: p.name,
          title: p.style_bullets?.[0] || "AI Persona",
          avatar: p.name.charAt(0).toUpperCase(),
          color: getColorForIndex(index),
          description:
            p.system_prompt?.substring(0, 60) + "..." ||
            "Chat with this persona",
        }));
        setPersonas(dbPersonas);
      }
    } catch (error) {
      console.error("Error fetching personas:", error);
      // Keep default personas on error
    }
  };

  const getColorForIndex = (index: number) => {
    const colors = [
      "bg-pink-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-gray-700",
      "bg-indigo-500",
      "bg-green-600",
      "bg-orange-500",
      "bg-red-500",
      "bg-teal-500",
      "bg-yellow-500",
      "bg-cyan-500",
      "bg-fuchsia-500",
    ];
    return colors[index % colors.length];
  };

  const handleStartChat = (slug: string) => {
    router.push(`/chat?persona=${slug}`);
  };

  const handlePersonaCreated = (newPersona: any) => {
    // Refresh personas list
    fetchPersonas();

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Select the new persona
    const displayPersona = {
      slug: newPersona.slug,
      name: newPersona.name,
      title: newPersona.style_bullets?.[0] || "AI Persona",
      avatar: newPersona.name.charAt(0).toUpperCase(),
      color: "bg-gradient-to-br from-blue-500 to-purple-600",
      description:
        newPersona.system_prompt?.substring(0, 60) + "..." ||
        "Chat with this persona",
    };
    setSelectedPersona(displayPersona);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-500" />
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-5xl font-bold mb-6 shadow-xl">
            {selectedPersona.avatar}
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            {selectedPersona.name}
          </h2>
          <p className="text-xl text-gray-600 mb-4">{selectedPersona.title}</p>
          <p className="text-gray-500 mb-8">{selectedPersona.description}</p>

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

        {/* Suggested Questions */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Suggested Questions
          </h3>
          <div className="space-y-3">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleStartChat(selectedPersona.slug)}
                className="w-full text-left px-6 py-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors flex items-center gap-3"
              >
                <Sparkles className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{question}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Available Personas Grid */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Choose Your AI Mentor
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  selectedPersona.slug === persona.slug
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full ${persona.color} text-white text-2xl font-bold flex items-center justify-center mx-auto mb-3`}
                >
                  {persona.avatar}
                </div>
                <h4 className="font-semibold text-gray-900 text-center mb-1">
                  {persona.name}
                </h4>
                <p className="text-xs text-gray-500 text-center">
                  {persona.title}
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
    </div>
  );
}
