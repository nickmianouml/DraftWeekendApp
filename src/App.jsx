import {
  lazy,
  Suspense,
} from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Header from "./components/Header";
import BottomNav from "./components/BottomNav";

import Standings from "./pages/Standings";

const PlayerProfile =
  lazy(() =>
    import(
      "./pages/PlayerProfile"
    )
  );

const PlayerSchedule =
  lazy(() =>
    import(
      "./pages/PlayerSchedule"
    )
  );

const Games =
  lazy(() =>
    import("./pages/Games")
  );

const GameDetails =
  lazy(() =>
    import(
      "./pages/GameDetails"
    )
  );

const Stats =
  lazy(() =>
    import("./pages/Stats")
  );

const Rules =
  lazy(() =>
    import("./pages/Rules")
  );

function PageLoader() {
  return (
    <div
      style={{
        minHeight: "180px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#8b949e",
        fontSize: "14px",
      }}
    >
      Loading...
    </div>
  );
}

function App() {
  return (
    <div
      style={{
        backgroundColor:
          "#0d1117",
        color: "white",
        minHeight: "100vh",
        padding: "20px",
        paddingBottom: "90px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <Header />

      <Suspense
        fallback={
          <PageLoader />
        }
      >
        <Routes>
          <Route
            path="/"
            element={
              <Standings />
            }
          />

          <Route
            path="/standings"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

          <Route
            path="/players/:playerName"
            element={
              <PlayerProfile />
            }
          />

          <Route
            path="/players/:playerName/schedule"
            element={
              <PlayerSchedule />
            }
          />

          <Route
            path="/games"
            element={
              <Games />
            }
          />

          <Route
            path="/games/:gameId"
            element={
              <GameDetails />
            }
          />

          <Route
            path="/stats"
            element={
              <Stats />
            }
          />

          <Route
            path="/rules"
            element={
              <Rules />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </Suspense>

      <BottomNav />
    </div>
  );
}

export default App;