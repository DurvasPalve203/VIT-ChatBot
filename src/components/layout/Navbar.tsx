import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Bot, Shield, GraduationCap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, userRole, viewMode, setViewMode, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = userRole === "admin";
  const showAdminUI = isAdmin && viewMode === "admin";

  const links = [
    { to: "/", label: "Home" },
    { to: "/chat", label: "Ask AI" },
    { to: "/knowledge", label: "Knowledge Base" },
    ...(showAdminUI ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 border border-accent/40">
            <Bot className="h-5 w-5 text-accent" />
          </div>
          <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.95rem' }}>
            VIT Intel
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent">{link.label}</Button>
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user && isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === "admin" ? "student" : "admin")}
              className="gap-1.5 text-xs border border-border text-muted-foreground hover:text-accent"
            >
              {viewMode === "admin" ? (
                <><GraduationCap className="h-3.5 w-3.5" /> Student View</>
              ) : (
                <><Shield className="h-3.5 w-3.5" /> Admin View</>
              )}
            </Button>
          )}
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-accent">
                <LogOut className="mr-1 h-4 w-4" /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-accent">Log in</Button></Link>
              <Link to="/chat"><Button variant="accent" size="sm" className="glow-accent">Start Chatting</Button></Link>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground">{link.label}</Button>
              </Link>
            ))}
            <hr className="my-2 border-border" />
            {user ? (
              <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            ) : (
              <Link to="/chat" onClick={() => setMobileOpen(false)}>
                <Button variant="accent" className="w-full glow-accent">Start Chatting</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
