"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Volume2, VolumeX } from "lucide-react";

const MORSE_CODE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----."
};

const ALL_CHARS = Object.keys(MORSE_CODE);

// 20 characters per minute timing
const DOT_DURATION = 300;
const DASH_DURATION = DOT_DURATION * 3;
const SYMBOL_GAP = DOT_DURATION;
const LETTER_GAP = DOT_DURATION * 3;

export default function MorseReceiverQuiz() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizState, setQuizState] = useState<"ready" | "playing" | "finalCountdown" | "completed">("ready");
  const [countdown, setCountdown] = useState(5);
  const [score, setScore] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackCancelRef = useRef(false);

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = () => {
    const newQuestions = Array.from({ length: 20 }, () => 
      ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)]
    );
    setQuestions(newQuestions);
    setAnswers({});
    setCurrentQuestion(0);
    setQuizState("ready");
    setScore(null);
    setCountdown(5);
  };

  const playMorseSound = (duration: number) => {
    if (!soundEnabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 600;
    oscillator.type = "sine";

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.005);
    gainNode.gain.setValueAtTime(0.3, now + (duration / 1000) - 0.005);
    gainNode.gain.linearRampToValueAtTime(0, now + (duration / 1000));

    oscillator.start(now);
    oscillator.stop(now + (duration / 1000));
  };

  const playMorseCharacter = async (morseCode: string) => {
    if (playbackCancelRef.current) return;

    for (let i = 0; i < morseCode.length; i++) {
      if (playbackCancelRef.current) break;

      const symbol = morseCode[i];
      const duration = symbol === "." ? DOT_DURATION : DASH_DURATION;

      setIsFlashing(true);
      playMorseSound(duration);
      await new Promise(resolve => setTimeout(resolve, duration));

      setIsFlashing(false);
      await new Promise(resolve => setTimeout(resolve, SYMBOL_GAP));
    }

    await new Promise(resolve => setTimeout(resolve, LETTER_GAP));
  };

  const startQuiz = async () => {
    playbackCancelRef.current = false;
    setQuizState("playing");

    for (let i = 0; i < questions.length; i++) {
      if (playbackCancelRef.current) break;

      setCurrentQuestion(i);
      const morse = MORSE_CODE[questions[i]];
      await playMorseCharacter(morse);

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (!playbackCancelRef.current) {
      setIsFlashing(false);
      setQuizState("finalCountdown");
    }
  };

  useEffect(() => {
    if (quizState === "finalCountdown") {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizState]);

  const submitQuiz = () => {
    let correct = 0;
    questions.forEach((char, index) => {
      if (answers[index]?.toUpperCase() === char) {
        correct++;
      }
    });
    setScore(correct);
    setQuizState("completed");
  };

  const handleAnswerChange = (index: number, value: string) => {
    if (quizState === "playing" || quizState === "finalCountdown") {
      setAnswers(prev => ({ ...prev, [index]: value.toUpperCase().slice(0, 1) }));
    }
  };

  const passed = score !== null && score >= 18;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Morse Code Receiver Quiz</h1>
          <p className="text-slate-600">Watch the visual morse code signals and identify each character (20 characters/minute)</p>
        </div>

        {quizState === "ready" && (
          <Card className="p-8 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Instructions</h2>
            <ul className="space-y-2 text-slate-700 mb-6">
              <li>• You will see 20 morse code signals as flashing light</li>
              <li>• Each signal has a 5 second gap before the next</li>
              <li>• Type your answer in the corresponding box</li>
              <li>• After all signals, you have 5 seconds to review</li>
              <li>• You need 18/20 to pass</li>
              <li>• Speed: 20 characters per minute</li>
            </ul>
            <div className="flex gap-4">
              <Button onClick={startQuiz} size="lg" className="flex-1">
                Start Quiz
              </Button>
              <Button
                onClick={() => setSoundEnabled(!soundEnabled)}
                variant={soundEnabled ? "default" : "outline"}
                size="lg"
                className="gap-2"
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                {soundEnabled ? "Sound On" : "Sound Off"}
              </Button>
            </div>
          </Card>
        )}

        {(quizState === "playing" || quizState === "finalCountdown") && (
          <>
            <Card className="p-8 mb-6" style={{ backgroundColor: '#000000' }}>
              <div className="flex items-center justify-center h-64">
                <div
                  className="w-32 h-32 rounded-full transition-all duration-75"
                  style={{
                    backgroundColor: isFlashing ? '#facc15' : '#000000',
                    boxShadow: isFlashing ? '0 0 60px rgba(250, 204, 21, 0.8)' : 'none'
                  }}
                />
              </div>
            </Card>

            <div className="mb-6 flex gap-4 items-center">
              {quizState === "playing" && (
                <Alert className="flex-1">
                  <AlertDescription>
                    Playing Question {currentQuestion + 1} of 20... Watch carefully!
                  </AlertDescription>
                </Alert>
              )}
              {quizState === "finalCountdown" && (
                <Alert className="flex-1 bg-amber-50 border-amber-200">
                  <AlertDescription className="text-amber-900 font-semibold">
                    Final Review: {countdown} seconds remaining! Auto-submit after countdown.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                onClick={() => setSoundEnabled(!soundEnabled)}
                variant={soundEnabled ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}

        {quizState === "completed" && score !== null && (
          <Alert className={`mb-6 ${passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <AlertDescription className={`font-semibold text-lg ${passed ? "text-green-900" : "text-red-900"}`}>
              {passed ? "✓ PASSED!" : "✗ FAILED"} Score: {score}/20 {passed ? "(18+ required to pass)" : "(Need 18+ to pass)"}
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-6">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i}>
                <Input
                  type="text"
                  value={answers[i] || ""}
                  onChange={(e) => handleAnswerChange(i, e.target.value)}
                  disabled={quizState === "ready" || quizState === "completed"}
                  maxLength={1}
                  className={`aspect-square text-center text-2xl font-bold uppercase ${
                    quizState === "completed" 
                      ? answers[i]?.toUpperCase() === questions[i]
                        ? "bg-green-100 border-green-500"
                        : "bg-red-100 border-red-500"
                      : ""
                  }`}
                  placeholder={`${i + 1}`}
                />
                {quizState === "completed" && (
                  <div className={`text-xs text-center font-medium mt-1 ${
                    answers[i]?.toUpperCase() === questions[i] ? "text-green-600" : "text-red-600"
                  }`}>
                    {questions[i]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {quizState === "completed" && (
          <div className="mt-6 flex gap-4">
            <Button onClick={generateQuestions} size="lg" className="flex-1">
              Try New Quiz
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}