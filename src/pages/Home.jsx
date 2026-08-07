import { useEffect, useState } from "react";
import { getLiveData } from "../services/live";

function Home() {
  const [live, setLive] = useState(null);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    async function loadLiveData() {
      try {
        setError("");

        const data = await getLiveData();

        setLive(data);
        setLastRefresh(new Date());
      } catch (err) {
        console.error("Live dashboard error:", err);
        setError("Unable to load live Draft Weekend data.");
      }
    }

    loadLiveData();

    const interval = setInterval(loadLiveData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div>
        <h1>🏆 Draft Weekend</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!live) {
    return (
      <div>
        <h1>🏆 Draft Weekend</h1>
        <p>Loading live dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            marginBottom: "6px",
          }}
        >
          🏆 Draft Weekend
        </h1>

        <p
          style={{
            margin: 0,
            color: "#3fb950",
            fontWeight: "bold",
          }}
        >
          ● LIVE
        </p>

        {lastRefresh && (
          <p
            style={{
              marginTop: "6px",
              color: "#8b949e",
              fontSize: "13px",
            }}
          >
            App refreshed{" "}
            {lastRefresh.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        )}
      </div>

      <DashboardCard
        icon="🎯"
        title="Current Game"
        value={live["Current Game"] || "Not Started"}
      />

      <DashboardCard
        icon="🏆"
        title="Current Leader"
        value={live["Leader"] || "-"}
        subValue={
          live["Leader Points"]
            ? `${Number(live["Leader Points"]).toLocaleString()} Points`
            : ""
        }
        highlight
      />

      <DashboardCard
        icon="🥈"
        title="Second Place"
        value={live["Second Place"] || "-"}
        subValue={
          live["Second Place Points"]
            ? `${Number(live["Second Place Points"]).toLocaleString()} Points`
            : ""
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <SmallStatCard
          icon="🔥"
          title="Highest PPS"
          value={live["Highest PPS"] || "0"}
          detail={live["Hottest Player"] || ""}
        />

        <SmallStatCard
          icon="🎲"
          title="Total Spins"
          value={live["Total Spins"] || "0"}
          detail="Awarded"
        />
      </div>

      {live["Biggest Climb"] && (
        <DashboardCard
          icon="📈"
          title="Biggest Climber"
          value={live["Biggest Climb"]}
        />
      )}

      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "12px",
          padding: "14px",
          marginTop: "20px",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#8b949e",
            fontSize: "13px",
          }}
        >
          Google Sheet timestamp
        </p>

        <p
          style={{
            margin: "5px 0 0 0",
          }}
        >
          {live["Last Updated"] || "Unavailable"}
        </p>
      </div>
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  value,
  subValue,
  highlight = false,
}) {
  return (
    <div
      style={{
        backgroundColor: "#21262d",
        border: highlight
          ? "1px solid #d29922"
          : "1px solid #30363d",
        borderRadius: "14px",
        padding: "18px",
        marginBottom: "16px",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#8b949e",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        {icon} {title}
      </p>

      <h2
        style={{
          margin: "10px 0 0 0",
          fontSize: "28px",
          color: highlight ? "#f2cc60" : "white",
        }}
      >
        {value}
      </h2>

      {subValue && (
        <p
          style={{
            margin: "7px 0 0 0",
            color: "#58a6ff",
          }}
        >
          {subValue}
        </p>
      )}
    </div>
  );
}

function SmallStatCard({
  icon,
  title,
  value,
  detail,
}) {
  return (
    <div
      style={{
        backgroundColor: "#21262d",
        border: "1px solid #30363d",
        borderRadius: "14px",
        padding: "16px",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#8b949e",
          fontSize: "13px",
          fontWeight: "bold",
        }}
      >
        {icon} {title}
      </p>

      <h2
        style={{
          margin: "10px 0 4px 0",
          fontSize: "24px",
        }}
      >
        {value}
      </h2>

      <p
        style={{
          margin: 0,
          color: "#c9d1d9",
          fontSize: "13px",
        }}
      >
        {detail}
      </p>
    </div>
  );
}

export default Home;