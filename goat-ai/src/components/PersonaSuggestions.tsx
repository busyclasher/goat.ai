import type { Persona } from "@/lib/supabase";
import Image from "next/image";

interface PersonaSuggestionsProps {
  suggestions: Persona[];
  onSelect: (slug: string) => void;
}

export function PersonaSuggestions({ suggestions, onSelect }: PersonaSuggestionsProps) {
  return (
    <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mb-2 z-10">
      <ul className="max-h-60 overflow-y-auto p-1">
        {suggestions.map((persona) => (
          <li
            key={persona.id}
            onClick={() => onSelect(persona.slug)}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
          >
            {persona.avatar_url ? (
              <Image src={persona.avatar_url} alt={persona.name} width={32} height={32} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {persona.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <span className="font-medium text-gray-800">{persona.name}</span>
              <span className="text-sm text-gray-500 ml-2">@{persona.slug}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
