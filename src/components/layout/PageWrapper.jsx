export function PageWrapper({ children }) {
  return (
    <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px 40px' }}>
      {children}
    </main>
  )
}