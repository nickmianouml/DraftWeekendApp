import "../styles/cards.css";
import SectionTitle from "./SectionTitle";

function Card({ icon, title, children }) {
  return (
    <div
      style={{
        background: "#161b22",
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        border: "1px solid #30363d",
      }}
    >
      <SectionTitle icon={icon} title={title} />

      {children}
    </div>
  );
}

export default Card;