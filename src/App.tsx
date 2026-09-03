import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public & Auth Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import OtpVerifyPage from './pages/auth/OtpVerifyPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import FirebaseAuthActionPage from './pages/auth/FirebaseAuthActionPage';
import NetworkStatusBanner from './components/common/NetworkStatusBanner';

// Dashboard Shell & Feature Pages
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import JournalPage from './pages/dashboard/JournalPage';
import AiAnalyzerPage from './pages/dashboard/AiAnalyzerPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import ChatPage from './pages/dashboard/ChatPage';
import MealPlanPage from './pages/dashboard/MealPlanPage';
import RecipesPage from './pages/dashboard/RecipesPage';
import ProfilePage from './pages/dashboard/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <NetworkStatusBanner />
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/__/auth/action" element={<FirebaseAuthActionPage />} />
          <Route path="/auth/action" element={<FirebaseAuthActionPage />} />

          {/* Protected Dashboard Routes wrapped in DashboardLayout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="journal" element={<JournalPage />} />
            <Route path="recipes" element={<RecipesPage />} />
            <Route path="analyzer" element={<AiAnalyzerPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="meal-plan" element={<MealPlanPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
