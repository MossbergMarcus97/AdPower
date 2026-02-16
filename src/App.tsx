import { Navigate, Route, Routes } from 'react-router-dom'
import { VariantWorkspace } from './components/VariantWorkspace'
import { activeTheme } from './data'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<VariantWorkspace theme={activeTheme} />} />
      <Route path="/swiss" element={<Navigate to="/" replace />} />
      <Route path="/neon" element={<Navigate to="/" replace />} />
      <Route path="/soft-tech" element={<Navigate to="/" replace />} />
      <Route path="/dark-luxury" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
