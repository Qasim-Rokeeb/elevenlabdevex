"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const SPEED_OPTIONS = [0.75, 1, 1.5] as const;

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3c.2 0 .4 0 .6.02A7 7 0 0 0 20.98 12.19c.02.2.02.4.02.6Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.83 2.83l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.91V20a2 2 0 0 1-4 0v-.14a1 1 0 0 0-.67-.91 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.83-2.83l.1-.1A1 1 0 0 0 6.4 15a1 1 0 0 0-.91-.6H5.4a2 2 0 0 1 0-4h.14a1 1 0 0 0 .91-.67 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 2.83-2.83l.1.1A1 1 0 0 0 10.18 6a1 1 0 0 0 .6-.91V5a2 2 0 0 1 4 0v.14a1 1 0 0 0 .6.91 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 0 1 2.83 2.83l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .91.6h.14a2 2 0 0 1 0 4h-.14a1 1 0 0 0-.91.6Z" />
    </svg>
  );
}

export default function Home() {
  const [text, setText] = useState("");
  const [speed, setSpeed] = useState<(typeof SPEED_OPTIONS)[number]>(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [scrolled, setScrolled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = stored === "dark" || stored === "light" ? stored : prefersDark ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      stopAudio();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, speed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Unable to generate speech.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      audioUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        if (audioUrlRef.current === url) {
          URL.revokeObjectURL(url);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setError("Unable to play the generated audio.");
        if (audioUrlRef.current === url) {
          URL.revokeObjectURL(url);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };

      await audio.play();
      setIsSpeaking(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate speech.");
      setIsSpeaking(false);
    } finally {
      setIsLoading(false);
    }
  };

  const canSpeak = text.trim().length > 0 && !isLoading;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={`${styles.topBar} ${scrolled ? styles.topBarScrolled : ""}`}>
          <div className={styles.logo}>Calm studio</div>
          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Settings"
            >
              <SettingsIcon />
            </button>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.inputWrap}>
            <textarea
              className={styles.textarea}
              placeholder="Paste or type your text here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Text to speak"
            />
            {error ? <p className={styles.error} role="status">{error}</p> : null}
          </div>

          <div className={styles.controlsRow}>
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel} htmlFor="voice-select">Voice</label>
              <select id="voice-select" className={styles.select} defaultValue="default" aria-label="Voice">
                <option value="default">Default voice</option>
              </select>
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel} id="speed-label">Speed</span>
              <div className={styles.segmented} role="radiogroup" aria-labelledby="speed-label">
                {SPEED_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={speed === option}
                    className={`${styles.segment} ${speed === option ? styles.segmentActive : ""}`}
                    onClick={() => setSpeed(option)}
                  >
                    {option}×
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.speakRow}>
            <button
              type="button"
              className={`${styles.speakButton} ${isSpeaking ? styles.speaking : ""}`}
              onClick={handleSpeak}
              disabled={!isSpeaking && !canSpeak}
              aria-pressed={isSpeaking}
              aria-label={isSpeaking ? "Stop speaking" : "Speak text"}
            >
              {isSpeaking ? (
                <>
                  <span className={styles.wave} aria-hidden="true">
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                  </span>
                  Stop
                </>
              ) : isLoading ? (
                "Generating…"
              ) : (
                "Speak"
              )}
            </button>
          </div>
        </main>

        <footer className={styles.footer}>Calm studio text to speech</footer>
      </div>
    </div>
  );
}
