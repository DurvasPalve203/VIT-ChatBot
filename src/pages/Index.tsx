import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Shield, Search, FileText, Users, ArrowRight, Zap } from "lucide-react";
import AnimatedRobot from "@/components/AnimatedRobot";
import FloatingParticles from "@/components/FloatingParticles";
import { useState, useEffect } from "react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Answers",
    description: "Ask questions in natural language and get accurate, cited responses from official VIT documents.",
  },
  {
    icon: BookOpen,
    title: "Complete Syllabus Access",
    description: "Browse branch-wise syllabi, academic regulations, and examination rules in one place.",
  },
  {
    icon: Shield,
    title: "Verified Information Only",
    description: "Every response is generated strictly from official documents — no hallucinations, no guesswork.",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description: "Our vector search engine finds the most relevant information across thousands of document pages.",
  },
  {
    icon: FileText,
    title: "Document Knowledge Base",
    description: "Access categorized notices, rules, and regulations — always up to date.",
  },
  {
    icon: Users,
    title: "Built for Everyone",
    description: "Designed for students, faculty, and staff — accessible, responsive, and easy to use.",
  },
];

const Index = () => {
  const [robotState, setRobotState] = useState<"idle" | "greeting">("idle");

  useEffect(() => {
    const timer = setTimeout(() => setRobotState("greeting"), 800);
    const resetTimer = setTimeout(() => setRobotState("idle"), 4000);
    return () => { clearTimeout(timer); clearTimeout(resetTimer); };
  }, []);

  return (
    <main className="relative">
      <FloatingParticles count={35} />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 hero-gradient" />
        <div className="scanline-overlay" />

        <div className="container relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 py-20">
          {/* Left - Text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent animate-fade-in">
              <Zap className="h-3 w-3" />
              Vishwakarma Institute of Technology
            </div>

            <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl animate-fade-in" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
              Your Campus,{" "}
              <span className="text-gradient">Intelligently</span>{" "}
              Answered
            </h1>

            <p className="mb-10 max-w-lg text-lg text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
              Get instant, verified answers about academics, syllabi, regulations, and campus life — powered by AI and official VIT documents.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row animate-fade-in" style={{ animationDelay: "0.45s", animationFillMode: "both" }}>
              <Link to="/chat">
                <Button variant="accent" size="xl" className="gap-2 glow-accent">
                  Start Chatting <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/knowledge">
                <Button variant="outline" size="xl" className="border-accent/30 text-foreground hover:bg-accent/10">
                  Browse Knowledge Base
                </Button>
              </Link>
            </div>
          </div>

          {/* Right - Robot */}
          <div className="flex-shrink-0 animate-fade-in" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
            <AnimatedRobot state={robotState} size="xl" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl neon-glow-text">
              Everything You Need to Know
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              No more digging through PDFs or waiting for office hours. Our AI reads every official document so you don't have to.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="card-elevated group rounded-xl neon-border bg-card p-6 animate-slide-up"
                style={{ animationDelay: `${0.1 * i}s`, animationFillMode: "both" }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mb-2 text-lg font-semibold" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "0.95rem" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20">
        <div className="container">
          <div className="rounded-2xl neon-border bg-card/50 p-12 text-center backdrop-blur-sm">
            <AnimatedRobot state="celebrating" size="md" className="mx-auto mb-6" />
            <h2 className="mb-4 text-3xl font-bold neon-glow-text">Ready to Get Started?</h2>
            <p className="mb-8 text-muted-foreground">No signup needed — start asking your academic questions right away.</p>
            <Link to="/chat">
              <Button variant="accent" size="xl" className="gap-2 glow-accent">
                Start Asking Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
