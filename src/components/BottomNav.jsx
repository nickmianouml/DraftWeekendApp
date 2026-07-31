import { NavLink } from "react-router-dom";
import "../styles/bottomNav.css";

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
        🏠
        <br />
        Home
      </NavLink>

      <NavLink to="/players" className={({ isActive }) => isActive ? "active" : ""}>
        👤
        <br />
        Players
      </NavLink>

      <NavLink to="/standings" className={({ isActive }) => isActive ? "active" : ""}>
        🏆
        <br />
        Standings
      </NavLink>

      <NavLink to="/stats" className={({ isActive }) => isActive ? "active" : ""}>
        📊
        <br />
        Stats
      </NavLink>
    </nav>
  );
}

export default BottomNav;