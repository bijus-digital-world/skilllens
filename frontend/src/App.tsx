import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { JobDescriptionsPage } from '@/pages/admin/JobDescriptionsPage'
import { CandidateCVsPage } from '@/pages/admin/CandidateCVsPage'
import { InterviewsPage } from '@/pages/admin/InterviewsPage'
import { ScheduleInterviewPage } from '@/pages/admin/ScheduleInterviewPage'
import { CandidateDashboard } from '@/pages/candidate/CandidateDashboard'
import { InterviewPage } from '@/pages/candidate/InterviewPage'
// Candidate results page removed — feedback is admin-only
import { InterviewResultPage } from '@/pages/admin/InterviewResultPage'
import { QuestionsPage } from '@/pages/admin/QuestionsPage'
import { QuestionSetDetailPage } from '@/pages/admin/QuestionSetDetailPage'
import { ComparePage } from '@/pages/admin/ComparePage'
import { ProfilesPage } from '@/pages/admin/ProfilesPage'
import { JdDetailPage } from '@/pages/admin/JdDetailPage'
import { LiveMonitorPage } from '@/pages/admin/LiveMonitorPage'
import { TeamPage } from '@/pages/admin/TeamPage'
import { PrepRoom } from '@/pages/candidate/PrepRoom'
import { FeedbackPage } from '@/pages/candidate/FeedbackPage'
import { ToastProvider } from '@/components/ui/Toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

function AppRoutes() {
  useAuth()
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/candidate'} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/candidate'} /> : <RegisterPage />} />
      <Route path="/forgot-password" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/candidate'} /> : <ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/change-password" element={user ? <ChangePasswordPage /> : <Navigate to="/login" />} />

      <Route element={<Layout />}>
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="job-descriptions" element={<JobDescriptionsPage />} />
          <Route path="job-descriptions/:id" element={<JdDetailPage />} />
          <Route path="cvs" element={<CandidateCVsPage />} />
          <Route path="interviews" element={<InterviewsPage />} />
          <Route path="interviews/:id/results" element={<InterviewResultPage />} />
          <Route path="schedule" element={<ScheduleInterviewPage />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="live" element={<LiveMonitorPage />} />
          <Route path="profiles" element={<ProfilesPage />} />
          <Route path="questions" element={<QuestionsPage />} />
          <Route path="questions/:id" element={<QuestionSetDetailPage />} />
          <Route path="team" element={<TeamPage />} />
        </Route>

        <Route
          path="/candidate"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/prep/:interviewId"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <PrepRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/interview/:interviewId"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <InterviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/feedback/:interviewId"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/candidate') : '/login'} />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
