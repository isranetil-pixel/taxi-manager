import { useState } from 'react'
import { supabase } from './supabase'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if (error) {
      setError('פרטי ההתחברות אינם נכונים')
      return
    }

    onLogin(data.user)
  }

  return (
    <div dir="rtl" style={{
      maxWidth: '380px',
      margin: '100px auto',
      padding: '30px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px #0002'
    }}>
      <h2 style={{ textAlign: 'center' }}>Taxi Manager</h2>
      <p style={{ textAlign: 'center' }}>התחברות למערכת</p>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="כתובת אימייל"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '12px', marginBottom: '12px' }}
        />

        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '12px', marginBottom: '12px' }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '12px', cursor: 'pointer' }}
        >
          {loading ? 'מתחבר...' : 'התחבר'}
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  )
}