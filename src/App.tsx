
import { useState } from 'react'
import HomePage from './pages/HomePage'

export type Page =
  | 'Overview'
  | 'Focus'
  | 'My Tasks'
  | 'Statistics'
  | 'History'
  | 'Settings'

function App() {
  const [activePage, setActivePage] = useState<Page>('Overview')

  return (
    <HomePage
      activePage={activePage}
      onNavigate={setActivePage}
    />
  )
}

export default App
