/**
 * Voice Session Manager
 * Handles recording, STT, TTS, and audio playback for voice conversations
 */

export type VoiceSessionState = "idle" | "listening" | "processing" | "talking";

export class VoiceSession {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private onStateChange?: (state: VoiceSessionState) => void;

  constructor(onStateChange?: (state: VoiceSessionState) => void) {
    this.onStateChange = onStateChange;
  }

  /**
   * Start recording audio from microphone
   */
  async startListening(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaStream = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      this.mediaRecorder = mediaRecorder;
      this.audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      mediaRecorder.start();
      this.onStateChange?.("listening");
    } catch (error) {
      console.error("Error starting recording:", error);
      throw new Error("Failed to access microphone");
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopListening(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No active recording"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });

        // Stop media stream tracks
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
          this.mediaStream = null;
        }

        if (audioBlob.size < 1000) {
          reject(new Error("Recording too short"));
          return;
        }

        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      this.onStateChange?.("processing");
    });
  }

  /**
   * Send audio to STT API and get transcript
   */
  async processVoiceInput(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const response = await fetch("/api/stt", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`STT API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.text || !data.text.trim()) {
      throw new Error("No speech detected");
    }

    return data.text.trim();
  }

  /**
   * Generate TTS audio from text
   */
  async generateVoiceResponse(
    text: string,
    voiceId: string
  ): Promise<string> {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const data = await response.json();
    return data.audioUrl;
  }

  /**
   * Play audio response and track completion
   */
  async playResponse(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any currently playing audio
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.onended = () => {
        this.onStateChange?.("idle");
        this.currentAudio = null;
        resolve();
      };

      audio.onerror = () => {
        this.onStateChange?.("idle");
        this.currentAudio = null;
        reject(new Error("Failed to play audio"));
      };

      audio.onplay = () => {
        this.onStateChange?.("talking");
      };

      audio.play().catch(reject);
    });
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  /**
   * Stop any ongoing audio playback
   */
  stopPlayback(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.onStateChange?.("idle");
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Stop recording if active
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Stop audio playback
    this.stopPlayback();

    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

