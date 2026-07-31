import { Link } from 'react-router-dom'

export function NotFoundPage() {
    return (
        <div style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '80vh',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '72px', margin: 0 }}>404</h1>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>
                Aradığın sayfa bulunamadı.
            </p>

            <Link
                to="/" 
                style={{ 
                padding: '10px 20px', 
                backgroundColor: '#6C63FF', 
                color: 'white', 
                borderRadius: '8px', 
                textDecoration: 'none' 
                }}
            >
                Ana Sayfaya Dön
            </Link>
        </div>
    )
}