import { useState, useEffect } from 'react';
import { getPersona, buildPersona } from '@/lib/personas';
import type { Persona } from '@/lib/supabase';

export function usePersona(personaSlug: string | null) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPersona = async () => {
      if (!personaSlug) {
        setPersona(null);
        return;
      };
      
      setIsLoading(true);
      setError(null);
      
      try {
        let personaData = await getPersona(personaSlug);
        if (!personaData) {
          personaData = await buildPersona(personaSlug);
        }
        setPersona(personaData);
      } catch (err) {
        console.error("Error loading persona:", err);
        setError("Failed to load persona");
      } finally {
        setIsLoading(false);
      }
    };

    loadPersona();
  }, [personaSlug]);

  return { persona, isLoading, error, setPersona };
}
