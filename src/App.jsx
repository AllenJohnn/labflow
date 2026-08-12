import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" closeButton />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;