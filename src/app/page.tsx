export default function Home() {
  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        <div className="card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Kunlik Sotuv</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>12,500,000 so'm</p>
        </div>
        
        <div className="card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Kassa Qoldig'i</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>84,200,000 so'm</p>
        </div>
        
        <div className="card">
          <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Yangi Buyurtmalar</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>8 ta</p>
        </div>
      </div>
    </div>
  );
}
