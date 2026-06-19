import { Bot } from "lucide-react";

const Footer = () => (
  <footer className="relative z-10 border-t border-border bg-card/50 backdrop-blur-sm py-10">
    <div className="container flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-accent" />
        <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem' }}>VIT Academic Intelligence</span>
      </div>
      <p className="text-sm text-muted-foreground">
        © 2026 Vishwakarma Institute of Technology. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
