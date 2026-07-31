function PlayerCard({ player }) {
  return (
    <div
      style={{
        background: "#161b22",
        padding: "15px",
        marginBottom: "12px",
        borderRadius: "12px",
      }}
    >
      <h3>{player.name}</h3>

      <p>
        {player.wins} - {player.losses}
      </p>
    </div>
  );
}

export default PlayerCard;