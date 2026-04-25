export function PageWrapper({ children }) {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      {children}
    </main>
  )
}