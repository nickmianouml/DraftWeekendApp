import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import BottomNav from "./components/BottomNav";

import Home from "./pages/Home";
import Standings from "./pages/Standings";
import Players from "./pages/Players";
import PlayerProfile from "./pages/PlayerProfile";
import Games from "./pages/Games";
import GameDetails from "./pages/GameDetails";
import Stats from "./pages/Stats";

function App() {
  return (
    <div
      style={{
        backgroundColor: "#0d1117",
        color: "white",
        minHeight: "100vh",
        padding: "20px",
        paddingBottom: "90px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:playerName" element={<PlayerProfile />} />
        <Route path="/games" element={<Games />} />
        <Route path="/games/:gameId" element={<GameDetails />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>

      <BottomNav />
    </div>
  );
}

export default App;