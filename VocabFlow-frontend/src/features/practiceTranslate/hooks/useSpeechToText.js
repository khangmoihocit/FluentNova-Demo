import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Browser-only Speech-to-Text using the free Web Speech API (SpeechRecognition).
 * Also records the microphone audio LOCALLY (in-memory Blob URL) so the user can
 * replay their own voice. The audio is NEVER uploaded — it lives only as a temporary
 * object URL and is revoked when reset/unmounted.
 *
 * @param {{ lang?: string }} options
 */
export default function useSpeechToText({ lang = 'en-US' } = {}) {
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioUrlRef = useRef(null);

  // Keep a ref of the latest audioUrl so cleanup can revoke it without re-subscribing.
  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  const stopMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* noop */
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    setListening(false);
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      setError('unsupported');
      return;
    }
    setError(null);
    setTranscript('');
    setInterimTranscript('');

    // Revoke previous recording (we keep only the most recent one, temporarily)
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      setAudioUrl(null);
    }

    // ── Start local audio recording for replay (best-effort) ──
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
        }
        stopMediaStream();
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch {
      // Mic recording is optional; STT can still work in some browsers. Continue without replay.
      mediaRecorderRef.current = null;
    }

    // ── Start speech recognition ──
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }
      if (finalText) {
        setTranscript((prev) => (prev ? `${prev} ${finalText}`.trim() : finalText.trim()));
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      setError(event.error || 'recognition_error');
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript('');
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          /* noop */
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError('start_failed');
      setListening(false);
    }
  }, [isSupported, lang, SpeechRecognition, stopMediaStream]);

  // Reset clears transcript + revokes the temporary recording (called when moving to next sentence).
  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
      setAudioUrl(null);
    }
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* noop */
        }
      }
      stopMediaStream();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, [stopMediaStream]);

  return {
    isSupported,
    listening,
    transcript,
    interimTranscript,
    audioUrl,
    error,
    start,
    stop,
    reset,
  };
}
