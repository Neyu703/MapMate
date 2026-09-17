import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import styles from './App.module.scss'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.appShell}>
        <h1>MapMate</h1>
      </div>
    </QueryClientProvider>
  )
}

export default App
