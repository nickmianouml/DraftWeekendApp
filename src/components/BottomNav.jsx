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
        <span className="bottom-nav-icon">
          🏆
        </span>

        <span className="bottom-nav-label">
          Standings
        </span>
      </NavLink>

      <NavLink
        to="/games"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span className="bottom-nav-icon">
          🎯
        </span>

        <span className="bottom-nav-label">
          Games
        </span>
      </NavLink>

      <NavLink
        to="/stats"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span className="bottom-nav-icon">
          📊
        </span>

        <span className="bottom-nav-label">
          All Time
        </span>
      </NavLink>

      <NavLink
        to="/rules"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span className="bottom-nav-icon">
          📖
        </span>

        <span className="bottom-nav-label">
          Rules
        </span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;