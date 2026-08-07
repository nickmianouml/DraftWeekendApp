import { NavLink } from "react-router-dom";
import "../styles/bottomNav.css";

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/">🏠<br />Home</NavLink>

      <NavLink to="/standings">🏆<br />Standings</NavLink>

      <NavLink to="/games">🎯<br />Games</NavLink>

      <NavLink to="/players">👥<br />Players</NavLink>

      <NavLink to="/stats">📊<br />Stats</NavLink>
    </nav>
  );
}

export default BottomNav;