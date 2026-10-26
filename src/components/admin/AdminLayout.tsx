import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ExternalLink,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu as MenuIcon,
  Settings,
  Tags,
  Utensils,
  X,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import styles from "./AdminLayout.module.css";

const NAV = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, end: true },
  { to: "/admin/insights", label: "Insights", icon: BarChart3 },
  { to: "/admin/pratos", label: "Pratos", icon: Utensils },
  { to: "/admin/categorias", label: "Categorias", icon: Tags },
  { to: "/admin/banners", label: "Banners", icon: ImageIcon },
  { to: "/admin/links", label: "Árvore de links", icon: Link2 },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { to: "/admin/conta", label: "Minha conta", icon: KeyRound },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>IA</span>
          <div>
            <strong>Império Açaí</strong>
            <small>Painel</small>
          </div>
          <button className={styles.closeNav} onClick={() => setOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ""}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sideFooter}>
          <a href="/cardapio" target="_blank" rel="noopener noreferrer" className={styles.navItem}>
            <ExternalLink size={18} /> Ver cardápio
          </a>
          <button className={styles.navItem} onClick={handleLogout}>
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {open && <div className={styles.scrim} onClick={() => setOpen(false)} />}

      <div className={styles.content}>
        <header className={styles.topbar}>
          <button className={styles.burger} onClick={() => setOpen(true)} aria-label="Abrir menu">
            <MenuIcon size={22} />
          </button>
          <span className={styles.user}>{user?.name}</span>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
