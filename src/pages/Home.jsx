import Card from "../components/Card";
import StatCard from "../components/StatCard";

function Home() {
  return (
    <>
      <Card icon="🏆" title="League Overview">
        <div
          style={{
            display: "flex",
            gap: "15px",
          }}
        >
          <StatCard label="Players" value="12" />
          <StatCard label="Seasons" value="5" />
          <StatCard label="Games" value="2,346" />
        </div>
      </Card>

      <Card icon="🔥" title="Hot Streak">
        <h3>Miano</h3>

        <p>6 straight wins</p>
      </Card>

      <Card icon="🎯" title="Latest Result">
        <p>Miano defeated Ant</p>
      </Card>
    </>
  );
}

export default Home;