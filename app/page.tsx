"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, HeartPulse, RotateCcw, ShieldCheck, Trophy, Volume2, VolumeX } from "lucide-react";

type Question = { id: number; level: number; situation: string; question: string; answers: string[]; correct: number; feedback: string };
type Phase = "start" | "playing" | "feedback" | "level" | "done";
const levelInfo = [
  { title: "Kijk", subtitle: "Herken het risico", color: "#0e7490" },
  { title: "Stop", subtitle: "Kies de juiste actie", color: "#d97706" },
  { title: "Bescherm", subtitle: "Voorkom verspreiding", color: "#be123c" },
];
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [round, setRound] = useState<Question[]>([]);
  const [phase, setPhase] = useState<Phase>("start");
  const [level, setLevel] = useState(1);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [sound, setSound] = useState(true);
  const [error, setError] = useState("");
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
  const basePath = window.location.pathname.startsWith("/stop-de-mrsa")
  ? "/stop-de-mrsa"
  : "";

fetch(`${basePath}/data/questions.json`).then((response) => {
      if (!response.ok) throw new Error();
      return response.json();
    }).then((data: Question[]) => setQuestions(data))
      .catch(() => setError("De spelgegevens konden niet worden geladen. Vernieuw de pagina."));
  }, []);

  const beep = useCallback((right: boolean) => {
    if (!sound) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = audioRef.current ?? new AudioContextClass();
    audioRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = right ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(right ? 660 : 180, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
  }, [sound]);

  const prepareLevel = useCallback((nextLevel: number) => {
    setRound(shuffle(questions.filter((item) => item.level === nextLevel)).slice(0, 4));
    setLevel(nextLevel); setIndex(0); setSelected(null); setPhase("playing");
  }, [questions]);

  const startGame = () => { setScore(0); prepareLevel(1); };
  const chooseAnswer = useCallback((answerIndex: number) => {
    if (phase !== "playing" || selected !== null || !round[index]) return;
    const right = answerIndex === round[index].correct;
    setSelected(answerIndex);
    if (right) setScore((current) => current + level * 100);
    beep(right); setPhase("feedback");
  }, [beep, index, level, phase, round, selected]);
  const continueGame = useCallback(() => {
    if (index < round.length - 1) { setIndex((current) => current + 1); setSelected(null); setPhase("playing"); return; }
    setPhase(level === 3 ? "done" : "level");
  }, [index, level, round.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phase === "playing" && ["1", "2", "3"].includes(event.key)) chooseAnswer(Number(event.key) - 1);
      if (phase === "feedback" && event.key === "Enter") continueGame();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chooseAnswer, continueGame, phase]);

  const current = round[index];
  const progress = phase === "start" ? 0 : ((level - 1) * 4 + index + (phase === "feedback" ? 1 : 0)) / 12 * 100;

  return <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
    <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-700 text-white"><ShieldCheck size={25}/></span><div><p className="text-lg font-black tracking-tight">Stop de MRSA</p><p className="text-sm text-slate-500">Hygiëne begint bij jou</p></div></div>
        <button aria-label={sound ? "Geluid uitzetten" : "Geluid aanzetten"} onClick={() => setSound(!sound)} className="rounded-xl border border-slate-200 p-3 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-cyan-200">{sound ? <Volume2 size={21}/> : <VolumeX size={21}/>}</button>
      </div>
    </header>
    <div className="h-2 bg-slate-100"><div className="h-full bg-cyan-600 transition-all duration-500" style={{width:`${progress}%`}}/></div>
    <section className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr] lg:py-10">
      <aside className="hidden rounded-3xl bg-slate-900 p-5 text-white lg:block">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Jouw missie</p>
        <div className="space-y-3">{levelInfo.map((item, i) => <div key={item.title} className={`rounded-2xl p-4 ${level === i+1 && phase !== "start" ? "bg-white text-slate-900" : "bg-white/8 text-slate-300"}`}><p className="text-xs font-bold">LEVEL {i+1}</p><p className="mt-1 font-black">{item.title}</p><p className="text-sm opacity-70">{item.subtitle}</p></div>)}</div>
        <div className="mt-7 flex items-center gap-3 rounded-2xl bg-cyan-950 p-4"><HeartPulse className="text-cyan-300"/><div><p className="text-xs text-cyan-200">SCORE</p><p className="text-xl font-black">{score}</p></div></div>
      </aside>
      <div className="min-h-[560px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        {error && <div className="m-8 rounded-2xl bg-red-50 p-5 text-red-800">{error}</div>}
        {phase === "start" && <div className="flex min-h-[560px] flex-col justify-between">
          <div className="relative overflow-hidden bg-cyan-700 px-7 py-12 text-white sm:px-12"><div className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[28px] border-white/10"/><p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-200">Educatieve training</p><h1 className="mt-4 max-w-xl text-4xl font-black leading-tight sm:text-5xl">Kun jij de verspreiding stoppen?</h1><p className="mt-5 max-w-xl text-lg leading-8 text-cyan-50">Een ongewassen hand kan de MRSA-bacterie ongemerkt verder brengen. Herken risico’s, handel juist en bescherm patiënten.</p></div>
          <div className="grid gap-6 p-7 sm:grid-cols-[1fr_auto] sm:items-center sm:p-12"><div><p className="font-bold text-slate-900">3 levels · 12 situaties · ongeveer 5 minuten</p><p className="mt-2 text-slate-600">Gebruik je muis of de cijfertoetsen 1, 2 en 3.</p></div><button disabled={!questions.length} onClick={startGame} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-700 px-7 py-4 font-bold text-white transition hover:bg-cyan-800 disabled:opacity-40 focus:outline-none focus:ring-4 focus:ring-cyan-200">Start de training <ArrowRight size={20}/></button></div>
        </div>}
        {(phase === "playing" || phase === "feedback") && current && <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full px-4 py-2 text-sm font-black text-white" style={{background:levelInfo[level-1].color}}>LEVEL {level} · {levelInfo[level-1].title.toUpperCase()}</span><span className="text-sm font-bold text-slate-500">Situatie {index+1} van {round.length}</span></div>
          <div className="mt-7 rounded-2xl border-l-4 border-cyan-600 bg-cyan-50 p-5 text-cyan-950"><p className="text-sm font-bold uppercase tracking-wider text-cyan-700">Op de afdeling</p><p className="mt-2 text-lg leading-7">{current.situation}</p></div>
          <h2 className="mt-7 text-2xl font-black leading-tight text-slate-900">{current.question}</h2>
          <div className="mt-6 space-y-3">{current.answers.map((answer, i) => { const right=phase==="feedback"&&i===current.correct; const wrong=phase==="feedback"&&i===selected&&i!==current.correct; return <button key={answer} disabled={phase==="feedback"} onClick={()=>chooseAnswer(i)} className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left font-semibold transition focus:outline-none focus:ring-4 focus:ring-cyan-200 ${right?"border-emerald-500 bg-emerald-50 text-emerald-950":wrong?"border-rose-500 bg-rose-50 text-rose-950":"border-slate-200 hover:border-cyan-500 hover:bg-cyan-50"}`}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm text-slate-700">{i+1}</span><span className="pt-0.5">{answer}</span></button>})}</div>
          {phase === "feedback" && <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white"><p className="font-black">{selected===current.correct?"Goed gehandeld!":"Dit kan veiliger."}</p><p className="mt-2 leading-7 text-slate-300">{current.feedback}</p><button onClick={continueGame} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-900 hover:bg-cyan-50">Verder <ArrowRight size={18}/></button><p className="mt-2 text-xs text-slate-400">Of druk op Enter</p></div>}
        </div>}
        {phase === "level" && <div className="grid min-h-[560px] place-items-center p-8 text-center"><div><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700"><ShieldCheck size={42}/></div><p className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-emerald-700">Level {level} voltooid</p><h2 className="mt-3 text-4xl font-black text-slate-900">Je bent alerter geworden</h2><p className="mx-auto mt-4 max-w-md text-lg leading-8 text-slate-600">Ga door naar level {level+1}. De situaties worden moeilijker en vragen om nauwkeuriger handelen.</p><button onClick={()=>prepareLevel(level+1)} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-cyan-700 px-7 py-4 font-bold text-white hover:bg-cyan-800">Naar level {level+1} <ArrowRight size={20}/></button></div></div>}
        {phase === "done" && <div className="grid min-h-[560px] place-items-center bg-slate-900 p-8 text-center text-white"><div><Trophy className="mx-auto text-amber-300" size={70}/><p className="mt-6 text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Training voltooid</p><h2 className="mt-3 text-4xl font-black">Samen stoppen we MRSA</h2><p className="mt-5 text-2xl font-black text-amber-300">Eindscore: {score} punten</p><p className="mx-auto mt-4 max-w-lg text-lg leading-8 text-slate-300">Blijf alert op contactmomenten. Spreek patiënten, bezoekers en collega’s vriendelijk aan en volg altijd het lokale hygiëneprotocol.</p><button onClick={startGame} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-slate-900 hover:bg-cyan-50"><RotateCcw size={19}/> Opnieuw spelen</button></div></div>}
      </div>
    </section>
    <footer className="px-4 pb-8 text-center text-sm text-slate-500">Educatief prototype · Raadpleeg bij twijfel altijd het geldende ziekenhuisprotocol.</footer>
  </main>;
}
