import { Navigate, Route, Routes } from 'react-router-dom'
import { ThemePicker } from './components/ThemePicker'
import { VariantWorkspace } from './components/VariantWorkspace'
import { themes } from './data'

function ThemeRoutes() {
  return (
    <>
      {themes.map((theme) => (
        <Route
          key={theme.id}
          path={`/${theme.route}`}
          element={<VariantWorkspace theme={theme} />}
        />
      ))}
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ThemePicker />} />
      <ThemeRoutes />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
