import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import JobsPage from "./pages/JobsPage";
import FreelancersProfilePage from "./pages/FreelancersProfilePage";
import MessagePage from "./pages/MessagePage";
import PaymentPage from "./pages/PaymentPage";
import ProfilePage from "./pages/ProfilePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import ProtectedRoute from "./components/ProtectedRoute";
import StripeOnboardingPage from "./pages/StripeOnboardingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { getSocket } from "./services/socket";

function Layout({ children }) {
  const location = useLocation();
  const hideLayout =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideLayout && <Navbar />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}

export default function App() {

  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      getSocket().catch(err => {
        console.error("Failed to initialize socket:", err);
      });
    }
  }, [user?.uid]);


  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/about" element={<About />} />
         
          <Route
            path="/messages/:conversationId?"
            element={
              <ProtectedRoute>
                <MessagePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/settings/payment" 
            element={<StripeOnboardingPage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/freelancer/:uid"
            element={
              <ProtectedRoute>
                <FreelancersProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Privacy Policy Route */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
