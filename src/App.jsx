import PlayerProfile from "./pages/PlayerProfile";
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home";
import Players from "./pages/Players";
import Standings from "./pages/Standings";
import Stats from "./pages/Stats";

import "./styles/App.css";

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/players" element={<Players />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/players/:playerName" element={<PlayerProfile />}
/>
      </Routes>
    </MainLayout>
  );
}

export default App;