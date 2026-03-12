'use client';
import { useState, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type SectionType = "intro" | "concept" | "visual" | "example" | "quiz" | "summary";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Section {
  id: string;
  type: SectionType;
  title: string;
  icon: string;
  estimatedMinutes: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const sections: Section[] = [
  { id: "intro",    type: "intro",   title: "Introduction",         icon: "⚓", estimatedMinutes: 2 },
  { id: "concept",  type: "concept", title: "The Altitude Concept",  icon: "🌐", estimatedMinutes: 4 },
  { id: "visual",   type: "visual",  title: "The Celestial Sphere",  icon: "✨", estimatedMinutes: 3 },
  { id: "example",  type: "example", title: "Worked Example",        icon: "📐", estimatedMinutes: 5 },
  { id: "quiz",     type: "quiz",    title: "Knowledge Check",       icon: "🧪", estimatedMinutes: 4 },
  { id: "summary",  type: "summary", title: "Summary & Key Terms",   icon: "📋", estimatedMinutes: 2 },
];

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the Zenith Distance of a celestial body?",
    options: [
      "The angle between the body and the horizon",
      "90° minus the observed altitude",
      "The body's angle above the celestial equator",
      "The hour angle of the body at transit",
    ],
    correct: 1,
    explanation:
      "Zenith Distance (z) = 90° − Altitude (Ho). It is the angular distance from the observer's zenith straight down to the celestial body — the complement of altitude.",
  },
  {
    id: 2,
    question: "Which of the following best describes an Intercept in a celestial fix?",
    options: [
      "The difference between GHA and LHA",
      "The bearing of the celestial body from the assumed position",
      "The difference in nautical miles between calculated and observed altitudes",
      "The declination of the body at the time of sight",
    ],
    correct: 2,
    explanation:
      "The Intercept (a) = Hc − Ho (in arcminutes), converted directly to nautical miles. If Ho > Hc, the intercept is TOWARD the body. If Ho < Hc, it is AWAY.",
  },
  {
    id: 3,
    question: "What does LHA stand for and how is it calculated?",
    options: [
      "Local Hour Angle — GHA + West Longitude (or GHA − East Longitude)",
      "Local Hour Angle — GHA + East Longitude",
      "Lunar Hour Angle — calculated from the Moon's GHA only",
      "Lateral Hour Angle — the azimuth measured from the meridian",
    ],
    correct: 0,
    explanation:
      "LHA = GHA + East longitude OR GHA − West longitude. It is the angle at the pole between the observer's meridian and the hour circle of the body, measured westward 0°–360°.",
  },
];

const keyTerms = [
  { term: "GHA",            def: "Greenwich Hour Angle — angular distance westward from the Greenwich meridian to the body's hour circle" },
  { term: "LHA",            def: "Local Hour Angle — GHA adjusted for the observer's longitude" },
  { term: "Declination",    def: "Angular distance of a body N or S of the celestial equator (analogous to latitude)" },
  { term: "Altitude (Ho)",  def: "Observed altitude — the sextant reading corrected for index error, dip, and refraction" },
  { term: "Altitude (Hc)",  def: "Calculated altitude — computed from assumed position, LHA, and declination using sight reduction tables" },
  { term: "Intercept",      def: "Difference between Hc and Ho in nautical miles; determines which side of the AP the LOP lies" },
  { term: "Azimuth (Zn)",   def: "True bearing of the celestial body from the observer, used to draw the Line of Position" },
  { term: "Zenith Distance",def: "90° − Altitude; the angular distance from observer's zenith to the body" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 5,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "linear-gradient(to right, #2e8bc0, #4ecdc4)",
            borderRadius: 99,
            transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: "#4ecdc4", fontWeight: 700, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

function NavDot({
  section,
  active,
  completed,
  onClick,
}: {
  section: Section;
  active: boolean;
  completed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={section.title}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 10,
        border: "none",
        background: active
          ? "rgba(78,205,196,0.15)"
          : completed
          ? "rgba(78,205,196,0.06)"
          : "transparent",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        transition: "background 0.2s",
        outline: active ? "1px solid rgba(78,205,196,0.4)" : "none",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: completed
            ? "linear-gradient(135deg,#2e8bc0,#4ecdc4)"
            : active
            ? "rgba(78,205,196,0.2)"
            : "rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          flexShrink: 0,
          transition: "background 0.3s",
        }}
      >
        {completed ? "✓" : section.icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: active ? 600 : 400,
            color: active ? "#f8faff" : completed ? "rgba(248,250,255,0.7)" : "rgba(248,250,255,0.45)",
            lineHeight: 1.2,
          }}
        >
          {section.title}
        </div>
        <div style={{ fontSize: 10, color: "rgba(141,164,191,0.7)", marginTop: 1 }}>
          {section.estimatedMinutes} min
        </div>
      </div>
    </button>
  );
}

function CalloutBox({
  type,
  children,
}: {
  type: "info" | "warning" | "tip" | "formula";
  children: React.ReactNode;
}) {
  const config = {
    info:    { emoji: "ℹ️", label: "Note",    bg: "rgba(46,139,192,0.12)",  border: "rgba(46,139,192,0.35)",  color: "#7ec8e3" },
    warning: { emoji: "⚠️", label: "Caution", bg: "rgba(244,200,66,0.08)", border: "rgba(244,200,66,0.3)",   color: "#f4c842" },
    tip:     { emoji: "💡", label: "Tip",     bg: "rgba(78,205,196,0.08)", border: "rgba(78,205,196,0.3)",   color: "#4ecdc4" },
    formula: { emoji: "📐", label: "Formula", bg: "rgba(167,139,250,0.08)",border: "rgba(167,139,250,0.3)",  color: "#c4b5fd" },
  };
  const c = config[type];
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: "14px 18px",
        margin: "20px 0",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{c.emoji}</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: c.color, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
          {c.label}
        </div>
        <div style={{ fontSize: 14, color: "rgba(248,250,255,0.8)", lineHeight: 1.65 }}>{children}</div>
      </div>
    </div>
  );
}

function StepCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: "20px 22px",
        marginBottom: 14,
        display: "flex",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#2e8bc0,#4ecdc4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          color: "#0a1628",
          flexShrink: 0,
          fontFamily: "'Syne',sans-serif",
          marginTop: 2,
        }}
      >
        {step}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f8faff", marginBottom: 6, fontFamily: "'Syne',sans-serif" }}>{title}</div>
        <div style={{ fontSize: 13.5, color: "rgba(248,250,255,0.7)", lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

function CelestialDiagram() {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setAngle((a) => (a + 0.4) % 360), 30);
    return () => clearInterval(id);
  }, []);

  const rad = (d: number) => (d * Math.PI) / 180;
  const cx = 160, cy = 160, R = 110;
  const bodyAngle = angle;
  const bx = cx + R * Math.cos(rad(bodyAngle - 90));
  const by = cy + R * Math.sin(rad(bodyAngle - 90));
  const altitude = 35;
  const horizonY = cy + R * 0.5;

  return (
    <div
      style={{
        background: "radial-gradient(ellipse at center, rgba(10,22,40,0.9) 0%, #060e1c 100%)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 13, color: "#4ecdc4", fontWeight: 600, letterSpacing: "0.5px" }}>
        CELESTIAL SPHERE — Interactive View
      </div>
      <svg width={320} height={320} viewBox="0 0 320 320">
        {/* Stars */}
        {[...Array(30)].map((_, i) => {
          const sx = (((i * 137.5) % 280) + 20);
          const sy = (((i * 97.3) % 280) + 20);
          const opacity = 0.3 + (i % 5) * 0.1;
          return <circle key={i} cx={sx} cy={sy} r={0.8} fill="white" opacity={opacity} />;
        })}

        {/* Celestial equator (outer circle) */}
        <circle cx={160} cy={160} r={R} stroke="rgba(46,139,192,0.4)" strokeWidth={1} fill="none" strokeDasharray="6 4" />

        {/* Horizon line */}
        <line x1={40} y1={horizonY} x2={280} y2={horizonY} stroke="rgba(78,205,196,0.5)" strokeWidth={1.5} />
        <text x={285} y={horizonY + 4} fontSize={10} fill="rgba(78,205,196,0.8)">Horizon</text>

        {/* Observer */}
        <circle cx={160} cy={horizonY} r={5} fill="#4ecdc4" />
        <text x={167} y={horizonY + 14} fontSize={9} fill="#4ecdc4">Observer</text>

        {/* Zenith line */}
        <line x1={160} y1={horizonY} x2={160} y2={30} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 3" />
        <text x={164} y={28} fontSize={10} fill="rgba(255,255,255,0.5)">Zenith</text>

        {/* Celestial body orbit arc */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />

        {/* Body position line from observer */}
        <line x1={160} y1={horizonY} x2={bx} y2={by} stroke="rgba(244,200,66,0.5)" strokeWidth={1.5} strokeDasharray="5 3" />

        {/* Altitude arc */}
        <path
          d={`M ${160 + 50} ${horizonY} A 50 50 0 0 1 ${160 + 50 * Math.cos(rad(-(altitude)))} ${horizonY - 50 * Math.sin(rad(altitude))}`}
          fill="none"
          stroke="#f4c842"
          strokeWidth={2}
        />
        <text x={215} y={horizonY - 18} fontSize={10} fill="#f4c842" fontWeight="bold">Alt (Ho)</text>

        {/* Celestial body */}
        <circle cx={bx} cy={by} r={8} fill="rgba(244,200,66,0.2)" stroke="#f4c842" strokeWidth={1.5} />
        <circle cx={bx} cy={by} r={3} fill="#f4c842" />
        {/* Glow */}
        <circle cx={bx} cy={by} r={14} fill="rgba(244,200,66,0.05)" />

        {/* Label */}
        <text x={bx + 12} y={by - 6} fontSize={10} fill="#fde68a" fontWeight="bold">☀ Body</text>

        {/* Hour angle arc at top */}
        <path
          d="M 160 50 A 30 30 0 0 1 185 60"
          fill="none"
          stroke="rgba(167,139,250,0.6)"
          strokeWidth={1.5}
        />
        <text x={170} y={48} fontSize={9} fill="rgba(167,139,250,0.9)">LHA</text>
      </svg>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          width: "100%",
        }}
      >
        {[
          { color: "#4ecdc4", label: "Horizon", desc: "Observer's plane" },
          { color: "#f4c842", label: "Altitude", desc: "Angle above horizon" },
          { color: "#c4b5fd", label: "LHA", desc: "Hour angle at pole" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 8,
              padding: "8px 10px",
              textAlign: "center",
            }}
          >
            <div style={{ width: 24, height: 3, background: item.color, borderRadius: 2, margin: "0 auto 6px" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{item.label}</div>
            <div style={{ fontSize: 10, color: "rgba(248,250,255,0.5)", marginTop: 2 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkedExample() {
  const [revealed, setRevealed] = useState<number[]>([]);
  const steps = [
    {
      title: "Extract from Nautical Almanac",
      body: "At 14h 32m 15s UTC, the Sun's GHA = 34° 22.4′ and Declination = N 18° 44.2′. Record these — they describe the Sun's position relative to Earth right now.",
      value: "GHA = 34° 22.4′  |  Dec = N 18° 44.2′",
    },
    {
      title: "Calculate LHA from Assumed Position",
      body: "Assumed Position: Lat 51° N, Long 002° 10.0′ W. LHA = GHA − West Longitude = 34° 22.4′ − 2° 10.0′",
      value: "LHA = 32° 12.4′",
    },
    {
      title: "Enter Sight Reduction Tables (HO249)",
      body: "With Lat 51°, Dec N 18°, LHA 32°, read from the tables: Hc = 38° 14′, d = +47, Z = 124°",
      value: "Hc = 38° 14′  |  Z = 124°  →  Zn = 124° (T)",
    },
    {
      title: "Apply the d-correction",
      body: "Fractional declination is 44.2′. d = +47. From Table 5: correction = +35′. Apply to Hc.",
      value: "Hc = 38° 14′ + 35′ = 38° 49′",
    },
    {
      title: "Compare Hc with Ho (observed)",
      body: "Your corrected sextant reading (Ho) = 39° 02.4′. Compare: Ho − Hc = 39° 02.4′ − 38° 49′",
      value: "Intercept = 13.4′ TOWARD (Ho > Hc)",
    },
    {
      title: "Plot the Line of Position",
      body: "From your AP, plot 13.4 nautical miles TOWARD bearing 124° T. Draw a perpendicular line — this is your Sun LOP.",
      value: "✓ LOP plotted — one sight complete",
    },
  ];

  return (
    <div>
      <div style={{ fontSize: 14, color: "rgba(248,250,255,0.65)", lineHeight: 1.7, marginBottom: 20 }}>
        Walk through a complete Sun sight reduction step by step. Click each step to reveal it — work through it yourself first!
      </div>
      {steps.map((s, i) => {
        const isRevealed = revealed.includes(i);
        return (
          <div
            key={i}
            style={{
              background: isRevealed ? "rgba(78,205,196,0.06)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isRevealed ? "rgba(78,205,196,0.2)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 12,
              padding: "16px 18px",
              marginBottom: 10,
              cursor: "pointer",
              transition: "all 0.25s",
            }}
            onClick={() => setRevealed((r) => (r.includes(i) ? r.filter((x) => x !== i) : [...r, i]))}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isRevealed ? 10 : 0 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: isRevealed ? "linear-gradient(135deg,#2e8bc0,#4ecdc4)" : "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: isRevealed ? "#0a1628" : "rgba(255,255,255,0.4)",
                  fontFamily: "'Syne',sans-serif",
                  flexShrink: 0,
                  transition: "all 0.3s",
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: isRevealed ? "#f8faff" : "rgba(248,250,255,0.6)", fontFamily: "'Syne',sans-serif" }}>
                {s.title}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(78,205,196,0.7)" }}>
                {isRevealed ? "▲ hide" : "▼ reveal"}
              </span>
            </div>
            {isRevealed && (
              <>
                <div style={{ fontSize: 13.5, color: "rgba(248,250,255,0.7)", lineHeight: 1.7, paddingLeft: 36, marginBottom: 10 }}>
                  {s.body}
                </div>
                <div
                  style={{
                    marginLeft: 36,
                    background: "rgba(167,139,250,0.1)",
                    border: "1px solid rgba(167,139,250,0.25)",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#c4b5fd",
                    fontFamily: "monospace",
                    letterSpacing: "0.3px",
                  }}
                >
                  {s.value}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuizSection({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? questions.filter((q) => answers[q.id] === q.correct).length
    : 0;

  return (
    <div>
      <div style={{ fontSize: 14, color: "rgba(248,250,255,0.65)", lineHeight: 1.7, marginBottom: 24 }}>
        Test your understanding of this section. There are {questions.length} questions — no time limit, no pressure. Think carefully before submitting.
      </div>

      {questions.map((q, qi) => {
        const chosen = answers[q.id];
        const isCorrect = submitted && chosen === q.correct;
        const isWrong = submitted && chosen !== undefined && chosen !== q.correct;

        return (
          <div
            key={q.id}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${submitted ? (isCorrect ? "rgba(78,205,196,0.3)" : isWrong ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)") : "rgba(255,255,255,0.07)"}`,
              borderRadius: 14,
              padding: "20px 22px",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: "rgba(46,139,192,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#7ec8e3", flexShrink: 0,
                  fontFamily: "'Syne',sans-serif",
                }}
              >
                Q{qi + 1}
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 500, color: "#f8faff", lineHeight: 1.5 }}>{q.question}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 36 }}>
              {q.options.map((opt, oi) => {
                const isSelected = chosen === oi;
                const isRightAnswer = submitted && oi === q.correct;
                const isSelectedWrong = submitted && isSelected && oi !== q.correct;

                return (
                  <button
                    key={oi}
                    onClick={() => !submitted && setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `1px solid ${
                        isRightAnswer ? "rgba(78,205,196,0.5)"
                        : isSelectedWrong ? "rgba(239,68,68,0.5)"
                        : isSelected ? "rgba(46,139,192,0.5)"
                        : "rgba(255,255,255,0.08)"
                      }`,
                      background: isRightAnswer
                        ? "rgba(78,205,196,0.1)"
                        : isSelectedWrong
                        ? "rgba(239,68,68,0.1)"
                        : isSelected
                        ? "rgba(46,139,192,0.12)"
                        : "rgba(255,255,255,0.02)",
                      color: isRightAnswer ? "#4ecdc4" : isSelectedWrong ? "#f87171" : isSelected ? "#93c5fd" : "rgba(248,250,255,0.65)",
                      fontSize: 13.5,
                      textAlign: "left",
                      cursor: submitted ? "default" : "pointer",
                      transition: "all 0.15s",
                      fontFamily: "'DM Sans',sans-serif",
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 12, opacity: 0.6, minWidth: 16 }}>{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                    {isRightAnswer && <span style={{ marginLeft: "auto", fontSize: 14 }}>✓</span>}
                    {isSelectedWrong && <span style={{ marginLeft: "auto", fontSize: 14 }}>✗</span>}
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div
                style={{
                  marginTop: 14,
                  marginLeft: 36,
                  background: "rgba(46,139,192,0.08)",
                  border: "1px solid rgba(46,139,192,0.2)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "rgba(248,250,255,0.75)",
                  lineHeight: 1.65,
                  display: "flex",
                  gap: 8,
                }}
              >
                <span>📖</span>
                <span>{q.explanation}</span>
              </div>
            )}
          </div>
        );
      })}

      {!submitted ? (
        <button
          onClick={() => Object.keys(answers).length === questions.length && setSubmitted(true)}
          style={{
            padding: "13px 32px",
            borderRadius: 12,
            border: "none",
            background:
              Object.keys(answers).length === questions.length
                ? "linear-gradient(135deg,#2e8bc0,#4ecdc4)"
                : "rgba(255,255,255,0.08)",
            color: Object.keys(answers).length === questions.length ? "#0a1628" : "rgba(255,255,255,0.3)",
            fontSize: 14,
            fontWeight: 700,
            cursor: Object.keys(answers).length === questions.length ? "pointer" : "not-allowed",
            fontFamily: "'Syne',sans-serif",
            transition: "all 0.2s",
          }}
        >
          {Object.keys(answers).length < questions.length
            ? `Answer all questions (${Object.keys(answers).length}/${questions.length})`
            : "Submit Answers →"}
        </button>
      ) : (
        <div
          style={{
            background:
              score === questions.length
                ? "rgba(78,205,196,0.1)"
                : score >= 2
                ? "rgba(244,200,66,0.1)"
                : "rgba(239,68,68,0.08)",
            border: `1px solid ${score === questions.length ? "rgba(78,205,196,0.3)" : score >= 2 ? "rgba(244,200,66,0.3)" : "rgba(239,68,68,0.3)"}`,
            borderRadius: 14,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 36 }}>{score === questions.length ? "🎉" : score >= 2 ? "👍" : "📚"}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: "#f8faff" }}>
              {score}/{questions.length} correct
            </div>
            <div style={{ fontSize: 13, color: "rgba(248,250,255,0.6)", marginTop: 3 }}>
              {score === questions.length
                ? "Perfect score! You're ready to move on."
                : score >= 2
                ? "Good understanding — review the explanations above."
                : "Revisit the Concept and Visual sections before proceeding."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Module Page ─────────────────────────────────────────────────────────
export default function ModulePage() {
  const [activeSection, setActiveSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const markComplete = () => {
    if (!completedSections.includes(activeSection)) {
      setCompletedSections((c) => [...c, activeSection]);
    }
  };

  const goTo = (idx: number) => {
    setActiveSection(idx);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    markComplete();
    if (activeSection < sections.length - 1) goTo(activeSection + 1);
  };

  const goPrev = () => {
    if (activeSection > 0) goTo(activeSection - 1);
  };

  const totalMinutes = sections.reduce((s, x) => s + x.estimatedMinutes, 0);
  const doneMinutes = completedSections.reduce((acc, i) => acc + sections[i].estimatedMinutes, 0);

  const sectionContent: Record<string, React.ReactNode> = {
    intro: (
      <div>
        <p style={{ fontSize: 15.5, lineHeight: 1.8, color: "rgba(248,250,255,0.8)", marginBottom: 20 }}>
          Celestial navigation is the art of determining your position at sea using astronomical bodies — the Sun, Moon, planets, and stars. Long before GPS, mariners crossed oceans with nothing but a sextant, a chronometer, and knowledge of the sky.
        </p>
        <p style={{ fontSize: 15.5, lineHeight: 1.8, color: "rgba(248,250,255,0.8)", marginBottom: 20 }}>
          As a Deck Officer Cadet, you are required to understand and perform celestial sight reduction to OOW standard. This module focuses on <strong style={{ color: "#4ecdc4" }}>altitude and azimuth calculation</strong> — the core of every celestial fix.
        </p>
        <CalloutBox type="info">
          This module covers one of the most common MCA oral exam topics. Examiners frequently ask candidates to walk through a complete Sun sight reduction from memory. Work through every section carefully.
        </CalloutBox>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 24 }}>
          {[
            { icon: "⏱", label: "Est. Time",   value: `${totalMinutes} min` },
            { icon: "🎯", label: "Difficulty",  value: "Intermediate" },
            { icon: "📋", label: "Exam Topic",  value: "MCA OOW Oral" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 11, color: "rgba(141,164,191,0.8)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f8faff", fontFamily: "'Syne',sans-serif" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    ),

    concept: (
      <div>
        <p style={{ fontSize: 15.5, lineHeight: 1.8, color: "rgba(248,250,255,0.8)", marginBottom: 20 }}>
          To find your position using a celestial body, you measure its <strong style={{ color: "#4ecdc4" }}>altitude</strong> — the angle between the body and the visible horizon — using a sextant. This measurement, combined with the time and the Nautical Almanac, gives you a <em>circle of equal altitude</em> on the Earth's surface.
        </p>
        <CalloutBox type="formula">
          <strong>Zenith Distance (z) = 90° − Altitude (Ho)</strong><br />
          The radius of your circle of equal altitude in degrees equals the zenith distance. Multiply by 60 to get nautical miles.
        </CalloutBox>
        <p style={{ fontSize: 15.5, lineHeight: 1.8, color: "rgba(248,250,255,0.8)", marginBottom: 16 }}>
          In practice, we don't draw the full circle. Instead, we use the <strong style={{ color: "#f4c842" }}>intercept method</strong> (Marcq St Hilaire) — comparing a <em>calculated</em> altitude (Hc) from an assumed position with the <em>observed</em> altitude (Ho) from your sextant.
        </p>
        <CalloutBox type="formula">
          <strong>Intercept (a) = Hc − Ho</strong><br />
          If Ho &gt; Hc → plot TOWARD the body<br />
          If Ho &lt; Hc → plot AWAY from the body<br />
          (Memory aid: <strong>HoMoTo</strong> — Ho More, Toward)
        </CalloutBox>
        <CalloutBox type="tip">
          <strong>HoMoTo</strong> is your most important memory aid for celestial navigation. Repeat it until it's automatic: <em>"Ho More? — go Toward."</em>
        </CalloutBox>
        <p style={{ fontSize: 15.5, lineHeight: 1.8, color: "rgba(248,250,255,0.8)" }}>
          Each sight gives you one <strong style={{ color: "#c4b5fd" }}>Line of Position (LOP)</strong>. Cross two or more LOPs and you have a fix. The Sun gives you one LOP; a three-body star fix at twilight gives a triangle ("cocked hat") from which your best position is the centre.
        </p>
      </div>
    ),

    visual: (
      <div>
        <p style={{ fontSize: 15.5, lineHeight: 1.8, color: "rgba(248,250,255,0.8)", marginBottom: 20 }}>
          The celestial sphere is an imaginary sphere of infinite radius centred on the Earth. All celestial bodies are projected onto its inner surface. Understanding its geometry is key to understanding sight reduction.
        </p>
        <CelestialDiagram />
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { title: "Geographic Position (GP)", body: "The point on Earth directly beneath a celestial body — where a line from the body through Earth's centre meets the surface." },
            { title: "Substellar Point", body: "Another name for GP, used specifically for stars. The GP of the Sun is called the subsolar point." },
            { title: "Hour Angle", body: "The angle at the pole between the observer's meridian and the body's hour circle, measured westward. LHA = GHA ± Longitude." },
            { title: "Declination", body: "The body's angular distance N or S of the celestial equator — the celestial equivalent of latitude on Earth." },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12,
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#4ecdc4", marginBottom: 6, fontFamily: "'Syne',sans-serif" }}>{card.title}</div>
              <div style={{ fontSize: 13, color: "rgba(248,250,255,0.65)", lineHeight: 1.6 }}>{card.body}</div>
            </div>
          ))}
        </div>
      </div>
    ),

    example: (
      <div>
        <WorkedExample />
      </div>
    ),

    quiz: (
      <div>
        <QuizSection questions={quizQuestions} />
      </div>
    ),

    summary: (
      <div>
        <p style={{ fontSize: 15.5, lineHeight: 1.8, color: "rgba(248,250,255,0.8)", marginBottom: 24 }}>
          You've completed the Celestial Navigation — Altitude & Azimuth module. Here's everything you need to carry forward.
        </p>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f8faff", fontFamily: "'Syne',sans-serif", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>📌</span> Process Summary
          </div>
          {[
            "Extract GHA and Declination from the Nautical Almanac for your UTC time of sight",
            "Choose an Assumed Position (AP) close to your DR position",
            "Calculate LHA = GHA ± Longitude",
            "Enter Sight Reduction Tables (HO249 or HO229) to find Hc and Zn",
            "Compare Hc with Ho: apply HoMoTo to determine intercept direction",
            "Plot the intercept from your AP along Zn; draw the perpendicular LOP",
          ].map((step, i) => (
            <StepCard key={i} step={i + 1} title="">
              {step}
            </StepCard>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f8faff", fontFamily: "'Syne',sans-serif", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>📖</span> Key Terms
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {keyTerms.map((kt) => (
              <div
                key={kt.term}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4ecdc4", marginBottom: 4, fontFamily: "monospace" }}>{kt.term}</div>
                <div style={{ fontSize: 12, color: "rgba(248,250,255,0.6)", lineHeight: 1.5 }}>{kt.def}</div>
              </div>
            ))}
          </div>
        </div>

        <CalloutBox type="warning">
          <strong>MCA Oral Tip:</strong> Examiners will ask you to draw a celestial diagram from scratch. Practise drawing the observer, horizon, zenith, celestial body, and LOP construction on a blank sheet until it takes under 90 seconds.
        </CalloutBox>
      </div>
    ),
  };

  const sec = sections[activeSection];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0a1628",
        fontFamily: "'DM Sans', sans-serif",
        color: "#f8faff",
      }}
    >
      {/* ── LEFT NAV ── */}
      <aside
        style={{
          width: 240,
          minHeight: "100vh",
          background: "#0f2042",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        {/* Module header */}
        <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 10, color: "#4ecdc4", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600, marginBottom: 6 }}>
            Celestial Navigation
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f8faff", lineHeight: 1.3, fontFamily: "'Syne',sans-serif", marginBottom: 14 }}>
            Altitude &amp; Azimuth Calculation
          </div>
          <ProgressBar current={completedSections.length} total={sections.length} />
          <div style={{ fontSize: 11, color: "rgba(141,164,191,0.6)", marginTop: 6 }}>
            {completedSections.length}/{sections.length} sections · {doneMinutes}/{totalMinutes} min
          </div>
        </div>

        {/* Section nav */}
        <nav style={{ padding: "10px 8px", flex: 1 }}>
          {sections.map((s, i) => (
            <NavDot
              key={s.id}
              section={s}
              active={i === activeSection}
              completed={completedSections.includes(i)}
              onClick={() => goTo(i)}
            />
          ))}
        </nav>

        {/* Bottom links */}
        <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, color: "rgba(141,164,191,0.5)", textAlign: "center" }}>
            🏅 Complete all sections to unlock your certificate
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main
        ref={contentRef}
        style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}
      >
        {/* Top bar */}
        <div
          style={{
            padding: "16px 40px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(10,22,40,0.8)",
            backdropFilter: "blur(8px)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>{sec.icon}</span>
          <div>
            <div style={{ fontSize: 11, color: "#4ecdc4", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
              Section {activeSection + 1} of {sections.length}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{sec.title}</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "rgba(141,164,191,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
            <span>⏱</span> {sec.estimatedMinutes} min read
          </div>
        </div>

        {/* Section content */}
        <div style={{ padding: "40px 48px", maxWidth: 760, margin: "0 auto", width: "100%" }}>
          <h2
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: "#f8faff",
              marginBottom: 28,
              lineHeight: 1.15,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                background: "linear-gradient(135deg,#2e8bc0,#4ecdc4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {sec.icon}
            </span>
            {sec.title}
          </h2>

          <div style={{ minHeight: 400 }}>{sectionContent[sec.id]}</div>
        </div>

        {/* Bottom navigation */}
        <div
          style={{
            padding: "20px 48px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: "auto",
            background: "#0a1628",
          }}
        >
          <button
            onClick={goPrev}
            disabled={activeSection === 0}
            style={{
              padding: "11px 22px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: activeSection === 0 ? "rgba(255,255,255,0.2)" : "rgba(248,250,255,0.7)",
              fontSize: 13,
              cursor: activeSection === 0 ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans',sans-serif",
              transition: "all 0.15s",
            }}
          >
            ← Previous
          </button>

          <div style={{ flex: 1 }}>
            <ProgressBar current={completedSections.length} total={sections.length} />
          </div>

          {activeSection < sections.length - 1 ? (
            <button
              onClick={goNext}
              style={{
                padding: "11px 24px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg,#2e8bc0,#4ecdc4)",
                color: "#0a1628",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Syne',sans-serif",
                transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: "0 4px 14px rgba(78,205,196,0.3)",
              }}
            >
              Mark Complete & Continue →
            </button>
          ) : (
            <button
              onClick={markComplete}
              style={{
                padding: "11px 24px",
                borderRadius: 10,
                border: "none",
                background: completedSections.includes(activeSection)
                  ? "rgba(78,205,196,0.15)"
                  : "linear-gradient(135deg,#f4c842,#f97316)",
                color: completedSections.includes(activeSection) ? "#4ecdc4" : "#0a1628",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Syne',sans-serif",
                boxShadow: completedSections.includes(activeSection) ? "none" : "0 4px 14px rgba(244,200,66,0.3)",
              }}
            >
              {completedSections.includes(activeSection) ? "✓ Module Complete!" : "🏆 Complete Module"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}