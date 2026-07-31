import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

function MainLayout({ children }) {
  return (
    <div className="app">
      <Header />

      <main
        style={{
          marginTop: "20px",
          marginBottom: "80px",
        }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  );
}

export default MainLayout;