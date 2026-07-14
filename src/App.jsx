import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Register from './pages/Register'
import VerifyRegistration from './pages/VerifyRegistration'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import GuideSection from './pages/GuideSection'
import DailyTracking from './pages/DailyTracking'
import Progress from './pages/Progress'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-registration" element={<VerifyRegistration />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/guide/:sectionId" element={<GuideSection />} />
      <Route path="/daily-tracking" element={<DailyTracking />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
