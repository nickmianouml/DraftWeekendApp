import { NavLink } from "react-router-dom";

import "../styles/bottomNav.css";

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span>🏆</span>
        <span>Standings</span>
      </NavLink>

      <NavLink
        to="/games"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span>🎯</span>
        <span>Games</span>
      </NavLink>

      <NavLink
        to="/stats"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span>📊</span>
        <span>All Time</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;