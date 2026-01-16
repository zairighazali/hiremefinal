import AppNavbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout({ children }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <AppNavbar />

      {/* MAIN CONTENT */}
      <main className="flex-grow-1 pt-5">
        {children}
      </main>

      <Footer />
    </div>
  );
}