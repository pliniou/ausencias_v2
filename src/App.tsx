import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";
import { ConfigProvider } from "@/context/ConfigContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import CalendarPage from "./pages/CalendarPage";
import LeavesPage from "./pages/LeavesPage";
// RegistrationsPage removed - consolidated into AdminDashboard
import Login from "./pages/Login";
import SetupPage from "./pages/SetupPage";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { Layout } from "@/components/layout/Layout";

const queryClient = new QueryClient();

// Wrapper for Layout to keep Login clean
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => <Layout>{children}</Layout>;

const App = () => (
    <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <TooltipProvider>
                <AuthProvider>
                    <DataProvider>
                        <ConfigProvider>
                            <Toaster />
                            <Sonner />
                            <HashRouter>
                                <Routes>
                                    <Route path="/setup" element={<SetupPage />} />
                                    <Route path="/login" element={<Login />} />

                                    <Route path="/" element={
                                        <ProtectedRoute>
                                            <LayoutWrapper><Index /></LayoutWrapper>
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/calendario" element={
                                        <ProtectedRoute>
                                            <LayoutWrapper><CalendarPage /></LayoutWrapper>
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/afastamentos" element={
                                        <ProtectedRoute>
                                            <LayoutWrapper><LeavesPage /></LayoutWrapper>
                                        </ProtectedRoute>
                                    } />
                                    {/* /cadastros route removed - consolidated into AdminDashboard */}
                                    <Route path="/admin" element={
                                        <ProtectedRoute roles={['admin']}>
                                            <LayoutWrapper><AdminDashboard /></LayoutWrapper>
                                        </ProtectedRoute>
                                    } />

                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </HashRouter>
                        </ConfigProvider>
                    </DataProvider>
                </AuthProvider>
            </TooltipProvider>
        </ThemeProvider>
    </QueryClientProvider>
);

export default App;
