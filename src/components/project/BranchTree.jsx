import { Link } from 'react-router-dom'

export function BranchTree({ projectId, branches }) {
  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gray-mid)', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--gray)' }}>
        Branches
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Link
          to={`/project/${projectId}`}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--blue)', textDecoration: 'none', padding: '6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '10px' }}>◆</span> main
        </Link>
        {branches.map((branch) => (
          <Link
            key={branch.id}
            to={`/project/${branch.id}`}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--black)',
              textDecoration: 'none', padding: '6px 0', paddingLeft: '16px',
              display: 'flex', alignItems: 'center', gap: '8px',
              borderLeft: '1px solid var(--gray)', marginLeft: '4px',
            }}
          >
            <span style={{ fontSize: '10px', color: 'var(--gray-mid)' }}>◇</span>
            {branch.branch_name || branch.name}
          </Link>
        ))}
        {!branches.length && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--gray-mid)', paddingLeft: '16px' }}>No branches</span>
        )}
      </div>
    </div>
  )
}
