import Login from './Login'
import { supabase } from './supabase'
import { useEffect, useState } from 'react'
import './App.css'

const initialVehicles = [
  { id: 1, name: 'Toyota Corolla', plate: '12-345-67', year: 2024, driver: 'ישראל ישראלי', price: 5500, status: 'מושכר' },
  { id: 2, name: 'Toyota RAV4', plate: '23-456-78', year: 2025, driver: 'דוד כהן', price: 6500, status: 'פנוי' },
  { id: 3, name: 'Toyota C-HR', plate: '34-567-89', year: 2024, driver: 'משה לוי', price: 5800, status: 'מושכר' },
]

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function App() {const [user, setUser] = useState(null)
const [checkingLogin, setCheckingLogin] = useState(true)
const [installPrompt, setInstallPrompt] = useState(null)
useEffect(() => {
  const handleInstallPrompt = (event) => {
    event.preventDefault()
    setInstallPrompt(event)
  }

  window.addEventListener('beforeinstallprompt', handleInstallPrompt)

  return () => {
    window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
  }
}, [])
async function handleLogout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    alert('שגיאה בהתנתקות: ' + error.message)
  }
}
useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    setUser(data.session?.user ?? null)
    setCheckingLogin(false)
  })


  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null)
    }
  )

  return () => listener.subscription.unsubscribe()
}, [])

async function installApp() {
  if (!installPrompt) {
    alert('פתח את תפריט Chrome ובחר התקנת האפליקציה או הוספה למסך הבית')
    return
  }

  installPrompt.prompt()
  await installPrompt.userChoice
  setInstallPrompt(null)
}


  const [vehicles, setVehicles] = useState([])
const [loadingVehicles, setLoadingVehicles] = useState(true)

useEffect(() => {

  if (!user) {
    setVehicles([])
    setLoadingVehicles(false)
    return
  }

  setLoadingVehicles(true)

  async function loadVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')

    if (error) {
      alert('שגיאה בטעינת רכבים: ' + error.message)
      setLoadingVehicles(false)
      return
    }

    if (data.length > 0) {
      setVehicles(data.map(item => item.data))
    } else {
      const savedVehiclesFromStorage = loadData('taxi_vehicles', [])
const savedVehicles = savedVehiclesFromStorage.length > 0 ? savedVehiclesFromStorage : initialVehicles

      setVehicles(savedVehicles)

      for (const vehicle of savedVehicles) {
        const { error } = await supabase
          .from('vehicles')
          .upsert({
            id: String(vehicle.id),
            data: vehicle
          })

        if (error) {
          alert('שגיאה בהעברת רכב לשרת: ' + error.message)
        }
      }
    }

    setLoadingVehicles(false)
  }

loadVehicles()
}, [user])

 

 const [drivers, setDrivers] = useState([])
const [loadingDrivers, setLoadingDrivers] = useState(true)
useEffect(() => {
  async function loadDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')

    if (error) {
      alert('שגיאה בטעינת נהגים: ' + error.message)
      setLoadingDrivers(false)
      return
    }

    if (data.length > 0) {
      setDrivers(data.map(item => item.data))
    } else {
      const localDrivers = loadData('taxi_drivers', [])
      setDrivers(localDrivers)

      for (const driver of localDrivers) {
        await supabase.from('drivers').upsert({
          id: String(driver.id),
          data: driver
        })
      }
    }

    setLoadingDrivers(false)
  }

  loadDrivers()
}, [])
useEffect(() => {
  if (loadingDrivers) return

  async function saveDrivers() {
    for (const driver of drivers) {
      const { error } = await supabase
        .from('drivers')
        .upsert({
          id: String(driver.id),
          data: driver
        })

      if (error) {
        console.error('שגיאה בשמירת נהג:', error)
      }
    }
  }

  saveDrivers()
}, [drivers, loadingDrivers]) 
const [contracts, setContracts] = useState([])
const [loadingContracts, setLoadingContracts] = useState(true)

useEffect(() => {
  async function loadContracts() {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')

    if (error) {
      alert('שגיאה בטעינת חוזים: ' + error.message)
      setLoadingContracts(false)
      return
    }

    if (data.length > 0) {
      setContracts(data.map(item => item.data))
    } else {
      const localContracts = loadData('taxi_contracts', [])
      setContracts(localContracts)

      for (const contract of localContracts) {
        await supabase.from('contracts').upsert({
          id: String(contract.id),
          data: contract
        })
      }
    }

    setLoadingContracts(false)
  }

  loadContracts()
}, [])

  const [page, setPage] = useState('dashboard')
  const [showForm, setShowForm] = useState(false)

  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    idNumber: '',
    vehicleId: '',
    price: '',
  })

  const [newContract, setNewContract] = useState({
  driverId: '',
  monthly: '',
  deposit: '',
  startDate: '',
  dueDay: '10'
})

  const [newVehicle, setNewVehicle] = useState({
    name: '', plate: '', year: '2026', driver: '', price: ''
  })

 useEffect(() => {
  if (loadingVehicles) return

  async function saveVehicles() {
    for (const vehicle of vehicles) {
      const { error } = await supabase
        .from('vehicles')
        .upsert({
          id: String(vehicle.id),
          data: vehicle
        })

      if (error) {
        console.error('שגיאה בשמירת רכב:', error)
      }
    }
  }

  saveVehicles()
}, [vehicles, loadingVehicles])

  useEffect(() => {
    localStorage.setItem('taxi_drivers', JSON.stringify(drivers))
  }, [drivers])

  useEffect(() => {
  localStorage.setItem('taxi_contracts', JSON.stringify(contracts))
}, [contracts])

  const rented = vehicles.filter(v => v.status === 'מושכר').length
  const available = vehicles.length - rented

  const income = vehicles
    .filter(v => v.status === 'מושכר')
    .reduce((sum, v) => sum + Number(v.price), 0)

  function toggleStatus(id) {
    setVehicles(vehicles.map(v =>
      v.id === id
        ? { ...v, status: v.status === 'מושכר' ? 'פנוי' : 'מושכר' }
        : v
    ))
  }
const [editingVehicleId, setEditingVehicleId] = useState(null)
  function addVehicle(e) {
  e.preventDefault()

  if (editingVehicleId !== null) {
    setVehicles(vehicles.map(v =>
      v.id === editingVehicleId
        ? {
            ...v,
            ...newVehicle,
            price: Number(newVehicle.price),
            year: Number(newVehicle.year)
          }
        : v
    ))

    setEditingVehicleId(null)
  } else {
    setVehicles([...vehicles, {
      ...newVehicle,
      id: Date.now(),
      price: Number(newVehicle.price),
      year: Number(newVehicle.year),
      driver: newVehicle.driver || 'לא משויך',
      status: 'פנוי'
    }])
  }

  setNewVehicle({
    name: '', plate: '', year: '2026', driver: '', price: ''
  })

  setShowForm(false)
}

async function deleteVehicle(id) {
  if (!window.confirm('האם למחוק את הרכב לצמיתות?')) return

  const activeContract = contracts.find(
    c => Number(c.vehicleId) === Number(id) && c.active !== false
  )

  if (activeContract) {
    alert('לא ניתן למחוק רכב שמשויך לחוזה פעיל. יש לסיים את החוזה תחילה.')
    return
  }

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', String(id))

  if (error) {
    alert('שגיאה במחיקת הרכב: ' + error.message)
    return
  }

  setVehicles(prev => prev.filter(v => v.id !== id))

  const updatedDrivers = drivers.map(d =>
    Number(d.vehicleId) === Number(id)
      ? { ...d, vehicleId: null }
      : d
  )

  setDrivers(updatedDrivers)

  alert('הרכב נמחק בהצלחה')
}
  async function addDriver(e) {
    e.preventDefault()

    const driver = {
      ...newDriver,
      id: Date.now(),
      vehicleId: newDriver.vehicleId ? Number(newDriver.vehicleId) : null,
      price: Number(newDriver.price),
      active: true
    }
const { error } = await supabase
  .from('drivers')
  .upsert({
    id: String(driver.id),
    data: driver
  })

if (error) {
  alert('שגיאה בשמירת נהג: ' + error.message)
  return
}
    setDrivers([...drivers, driver])

    setVehicles(vehicles.map(v =>
      v.id === driver.vehicleId
        ? { ...v, driver: driver.name, status: 'מושכר', price: driver.price }
        : v
    ))

    setNewDriver({
      name: '', phone: '', idNumber: '', vehicleId: '', price: ''
    })
    setShowForm(false)
  }

  function toggleDriver(id) {
    setDrivers(drivers.map(d =>
      d.id === id ? { ...d, active: !d.active } : d
    ))
  }


async function deleteDriver(id) {
  if (!window.confirm('למחוק את הנהג מהמערכת?')) return

  const driver = drivers.find(d => d.id === id)

  const { error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', String(id))

  if (error) {
    alert('שגיאה במחיקת הנהג: ' + error.message)
    return
  }

  setDrivers(prev => prev.filter(d => d.id !== id))

  if (driver?.vehicleId) {
    setVehicles(prev => prev.map(v =>
      v.id === driver.vehicleId
        ? { ...v, driver: 'לא משויך', status: 'פנוי' }
        : v
    ))
  }
}


function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

async function addContract(e) {
  e.preventDefault()

  const driver = drivers.find(
    d => d.id === Number(newContract.driverId)
  )

  if (!driver) return

  const contract = {
    id: Date.now(),
    driverId: driver.id,
    driverName: driver.name,
    vehicleId: driver.vehicleId,
    monthly: Number(newContract.monthly),
    deposit: Number(newContract.deposit),
    startDate: newContract.startDate,
    dueDay: Number(newContract.dueDay),
    paidMonth: '',
    active: true
  }

 setContracts([...contracts, contract])

const { error } = await supabase
  .from('contracts')
  .upsert({
    id: String(contract.id),
    data: contract
  })

if (error) {
  alert('שגיאה בשמירת החוזה: ' + error.message)
}

  setNewContract({
    driverId: '',
    monthly: '',
    deposit: '',
    startDate: '',
    dueDay: '10'
  })

  setShowForm(false)
}

function markPaid(id) {
  setContracts(contracts.map(c =>
    c.id === id
      ? { ...c, paidMonth: currentMonth() }
      : c
  ))
}

function contractStatus(contract) {
  if (contract.active === false) return 'הסתיים'

  if (contract.paidMonth === currentMonth()) {
    return 'שולם'
  }

  const today = new Date()

  if (today.getDate() > contract.dueDay) {
    return 'באיחור'
  }

  return 'ממתין לתשלום'
}

async function endContract(id) {
  const contract = contracts.find(c => c.id === id)
  if (!contract) return

  const updatedContract = {
    ...contract,
    active: false,
    endedAt: new Date().toISOString()
  }

  const { error } = await supabase
    .from('contracts')
    .upsert({
      id: String(id),
      data: updatedContract
    })

  if (error) {
    alert('שגיאה בעדכון החוזה: ' + error.message)
    return
  }

  setContracts(prev => prev.map(c =>
    c.id === id ? updatedContract : c
  ))

  setVehicles(prev => prev.map(v =>
    Number(v.id) === Number(contract.vehicleId)
      ? { ...v, status: 'פנוי' }
      : v
  ))

  alert('החוזה הסתיים בהצלחה')
}
async function deleteContract(id) {
  if (!window.confirm('האם למחוק את חוזה השכירות לצמיתות?')) return

  const contract = contracts.find(c => c.id === id)

  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', String(id))

  if (error) {
    alert('שגיאה במחיקת החוזה: ' + error.message)
    return
  }

  setContracts(prev => prev.filter(c => c.id !== id))

  if (contract?.active !== false && contract?.vehicleId) {
    setVehicles(prev => prev.map(v =>
      Number(v.id) === Number(contract.vehicleId)
        ? { ...v, status: 'פנוי' }
        : v
    ))
  }

  alert('החוזה נמחק בהצלחה')
}



  const menu = [
    { id: 'dashboard', icon: '▦', label: 'לוח בקרה' },
    { id: 'vehicles', icon: '🚕', label: 'ניהול רכבים' },
    { id: 'drivers', icon: '👨‍✈️', label: 'נהגים' },
    { id: 'finance', icon: '💰', label: 'הכנסות והוצאות' },
    { id: 'maintenance', icon: '🔧', label: 'טיפולים ותחזוקה' },
    { id: 'contracts', icon: '📄', label: 'חוזי שכירות' },
  ]
if (checkingLogin) return <div>טוען...</div>
if (!user) return <Login onLogin={setUser} />
  return (
    <div className="app" dir="rtl">

<aside className="sidebar">
  <div className="brand">

    <div
  className="brand-icon"
  style={{
    width: '55px',
    height: '55px',
    minWidth: '55px',
    overflow: 'hidden',
    borderRadius: '12px',
    flexShrink: 0
  }}
>
  <img
    src="/brand-icon.png"
    alt="Taxi Manager"
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }}
  />
</div>

    <div>
      <h2>Taxi Manager</h2>
      <span>מערכת ניהול צי מוניות</span>
    </div>

  </div>
        <div className="menu-title">תפריט ראשי</div>

        {menu.map(item => (
          <button
            key={item.id}
            className={`menu-item ${page === item.id ? 'active' : ''}`}
            onClick={() => {
              setPage(item.id)
              setShowForm(false)
            }}
          >
            {item.icon} &nbsp; {item.label}
          </button>
        ))}

        <div className="sidebar-bottom">
          <span>מערכת ניהול עסקית</span>
          <strong>גרסה 1.1</strong>
        </div>
        <button
  className="menu-item"
  onClick={handleLogout}
  style={{ marginTop: '20px', color: '#ff6b35' }}
>
  🚪 התנתקות
</button>
{!window.matchMedia('(display-mode: standalone)').matches && (
  <button
    className="menu-item"
    onClick={installApp}
    style={{ marginTop: '10px', color: '#f58220' }}
  >
    📲 התקנת האפליקציה
  </button>
)}
      
      </aside>

      <main className="main">

        <header className="topbar">
          <div>
            <h1>
              {menu.find(m => m.id === page)?.label || 'לוח בקרה'}
            </h1>
            <p>ברוכים הבאים למערכת ניהול השכרת המוניות</p>
          </div>
          <div className="user-avatar">מ</div>
        </header>

        {page === 'dashboard' && (
          <>
            <section className="welcome">
              <div>
                <h2>ניהול העסק במקום אחד 👋</h2>
                <p>כל הרכבים, הנהגים וההכנסות שלך במבט אחד.</p>
              </div>
              <button className="add-button"
                onClick={() => {
                  setPage('vehicles')
                  setShowForm(true)
                }}>
                + הוספת רכב חדש
              </button>
            </section>

            <section className="stats">
              <div className="stat-card">
                <div className="stat-icon orange">🚕</div>
                <p>סך כל הרכבים</p>
                <h2>{vehicles.length}</h2>
                <small>רכבים במערכת</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">✓</div>
                <p>רכבים מושכרים</p>
                <h2>{rented}</h2>
                <small>רכבים פעילים בהשכרה</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">🔑</div>
                <p>רכבים פנויים</p>
                <h2>{available}</h2>
                <small>ממתינים להשכרה</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">₪</div>
                <p>הכנסה חודשית פוטנציאלית</p>
                <h2>₪{income.toLocaleString('he-IL')}</h2>
                <small>לפי הרכבים המושכרים</small>
              </div>
            </section>

            <section className="table-card">
              <div className="table-heading">
                <div>
                  <h2>צי הרכבים שלי</h2>
                  <p>ניהול ומעקב אחר הרכבים בעסק</p>
                </div>
                <span className="count">{vehicles.length} רכבים</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>דגם הרכב</th>
                      <th>מספר רישוי</th>
                      <th>נהג</th>
                      <th>רכב ומספר רישוי</th>
                      <th>שכירות חודשית</th>
                      <th>סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(v => (
                      <tr key={v.id}>
                        <td>{v.name}</td>
                        <td>{v.plate}</td>
                        <td>{v.driver}</td>
                        <td>₪{v.price.toLocaleString('he-IL')}</td>
                        <td>{v.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {page === 'vehicles' && (
          <>
            <section className="welcome">
              <div>
                <h2>ניהול צי הרכבים 🚕</h2>
                <p>הוספה ומעקב אחר הרכבים בעסק.</p>
              </div>
              <button className="add-button"
  onClick={() => {
    setEditingVehicleId(null)
    setNewVehicle({
      name: '', plate: '', year: '2026', driver: '', price: ''
    })
    setShowForm(!showForm)
  }}>
  + הוספת רכב
</button>
            </section>

            {showForm && (
              <section className="form-card">
                <h2>{editingVehicleId !== null ? 'עריכת פרטי רכב' : 'רכב חדש'}</h2>
                <form onSubmit={addVehicle}>
                  <input placeholder="דגם הרכב" required
                    value={newVehicle.name}
                    onChange={e => setNewVehicle({...newVehicle, name:e.target.value})}/>
                  <input placeholder="מספר רישוי" required
                    value={newVehicle.plate}
                    onChange={e => setNewVehicle({...newVehicle, plate:e.target.value})}/>
                  <input placeholder="שנת ייצור" type="number"
                    value={newVehicle.year}
                    onChange={e => setNewVehicle({...newVehicle, year:e.target.value})}/>
                  <input placeholder="שם הנהג"
                    value={newVehicle.driver}
                    onChange={e => setNewVehicle({...newVehicle, driver:e.target.value})}/>
                  <input placeholder="שכירות חודשית" type="number" required
                    value={newVehicle.price}
                    onChange={e => setNewVehicle({...newVehicle, price:e.target.value})}/>
                  <button className="add-button" type="submit">
  {editingVehicleId !== null ? 'שמירת שינויים' : 'שמירת רכב'}
</button>
                </form>
              </section>
            )}

            <section className="table-card">
              <h2>רשימת הרכבים</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>דגם</th><th>מספר רישוי</th><th>נהג</th>
                      <th>שכירות</th><th>סטטוס</th><th>פעולה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(v => (
                      <tr key={v.id}>
                        <td>{v.name}</td>
                        <td>{v.plate}</td>
                        <td>{v.driver}</td>
                        <td>₪{v.price.toLocaleString('he-IL')}</td>
                        <td>{v.status}</td>
                        <td>
  <button
    className="status-button"
    onClick={() => toggleStatus(v.id)}
  >
    {v.status === 'מושכר' ? 'שחרור רכב' : 'השכרת רכב'}
  </button>

  <button
    className="status-button"
    onClick={() => {
  setEditingVehicleId(v.id)
  setNewVehicle({
    name: v.name,
    plate: v.plate,
    year: String(v.year),
    driver: v.driver,
    price: String(v.price)
  })
  setShowForm(true)
}}
  >
    ✏️ עריכה
  </button>
  <button
  className="cancel-button"
  onClick={() => deleteVehicle(v.id)}
>
  🗑️ מחיקת רכב
</button>
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {page === 'drivers' && (
          <>
            <section className="welcome">
              <div>
                <h2>ניהול הנהגים 👨‍✈️</h2>
                <p>ניהול פרטי נהגים ושיוך לרכבים.</p>
              </div>
              <button className="add-button"
                onClick={() => setShowForm(!showForm)}>
                + הוספת נהג חדש
              </button>
            </section>

            <section className="stats">
              <div className="stat-card">
                <div className="stat-icon orange">👨‍✈️</div>
                <p>סך כל הנהגים</p>
                <h2>{drivers.length}</h2>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">✓</div>
                <p>נהגים פעילים</p>
                <h2>{drivers.filter(d => d.active).length}</h2>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue">🚕</div>
                <p>נהגים עם רכב משויך</p>
                <h2>{drivers.filter(d => d.vehicleId).length}</h2>
              </div>
            </section>

            {showForm && (
              <section className="form-card">
                <h2>הוספת נהג חדש</h2>
                <form onSubmit={addDriver}>
                  <input placeholder="שם מלא" required
                    value={newDriver.name}
                    onChange={e => setNewDriver({...newDriver, name:e.target.value})}/>

                  <input placeholder="מספר טלפון" required
                    type="tel"
                    value={newDriver.phone}
                    onChange={e => setNewDriver({...newDriver, phone:e.target.value})}/>

                  <input placeholder="מספר תעודת זהות"
                    value={newDriver.idNumber}
                    onChange={e => setNewDriver({...newDriver, idNumber:e.target.value})}/>

                  <select value={newDriver.vehicleId}
                    onChange={e => setNewDriver({...newDriver, vehicleId:e.target.value})}>
                    <option value="">ללא שיוך רכב</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} – {v.plate}
                      </option>
                    ))}
                  </select>

                  <input placeholder="דמי שכירות חודשיים"
                    type="number" required
                    value={newDriver.price}
                    onChange={e => setNewDriver({...newDriver, price:e.target.value})}/>

                  <button className="add-button" type="submit">
                    שמירת נהג
                  </button>
                </form>
              </section>
            )}

            <section className="table-card">
              <div className="table-heading">
                <div>
                  <h2>רשימת הנהגים</h2>
                  <p>פרטי נהגים וסטטוס פעילות</p>
                </div>
                <span className="count">{drivers.length} נהגים</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>שם הנהג</th>
                      <th>טלפון</th>
                      <th>תעודת זהות</th>
                      <th>רכב משויך</th>
                      <th>שכירות חודשית</th>
                      <th>סטטוס</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map(d => (
                      <tr key={d.id}>
                        <td><strong>{d.name}</strong></td>
                        <td>{d.phone}</td>
                        <td>{d.idNumber || 'לא הוזן'}</td>
                        <td>
                          {vehicles.find(v => v.id === d.vehicleId)?.name || 'ללא רכב'}
                        </td>
                        <td>₪{d.price.toLocaleString('he-IL')}</td>
                        <td>{d.active ? 'פעיל' : 'לא פעיל'}</td>
                        <td>
                          <button className="status-button"
                            onClick={() => toggleDriver(d.id)}>
                            {d.active ? 'השבתה' : 'הפעלה'}
                          </button>
                          {' '}
                          <button className="cancel-button"
                            onClick={() => deleteDriver(d.id)}>
                            מחיקה
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {drivers.length === 0 && (
                <p className="empty-message">עדיין לא הוזנו נהגים. לחץ על הוספת נהג חדש כדי להתחיל.</p>
              )}
            </section>
          </>
        )}

 {page === 'finance' && (
  <section className="table-card">
    <h2>ניהול כספים</h2>
    <p>המודול עדיין בפיתוח.</p>
  </section>
)}

{page === 'maintenance' && (
  <section className="table-card">
    <h2>ניהול תחזוקה</h2>
    <p>המודול עדיין בפיתוח.</p>
  </section>
)}


{page === 'contracts' && (
  <section className="table-card">
    <h2>ניהול חוזים ושכירות</h2>

    <button
      type="button"
      onClick={() => setShowForm(!showForm)}
    >
      {showForm ? 'סגור טופס' : '+ חוזה שכירות חדש'}
    </button>

    {showForm && (
      <form onSubmit={addContract} className="vehicle-form">
        <label>בחירת נהג</label>
        <div className="custom-select">
  <details>
    <summary>
      {drivers.find(d => String(d.id) === String(newContract.driverId))?.name || 'בחר נהג'}
      <span>⌄</span>
    </summary>

    <div className="custom-options">
      <button
        type="button"
        onClick={() => setNewContract({
          ...newContract,
          driverId: ''
        })}
      >
        בחר נהג
      </button>

      {drivers.map(driver => (
        <button
          type="button"
          key={driver.id}
          onClick={(e) => {
            setNewContract({
              ...newContract,
              driverId: String(driver.id)
            })
            e.currentTarget.closest('details').open = false
          }}
        >
          {driver.name}
        </button>
      ))}
    </div>
  </details>
</div>

        <label>שכירות חודשית (₪)</label>
        <input
          type="number"
          value={newContract.monthly}
          onChange={e => setNewContract({
            ...newContract,
            monthly: e.target.value
          })}
          required
        />

        <label>פיקדון (₪)</label>
        <input
          type="number"
          value={newContract.deposit}
          onChange={e => setNewContract({
            ...newContract,
            deposit: e.target.value
          })}
        />

        <label>תאריך תחילת חוזה</label>
        <label>תאריך תחילת חוזה</label>
<input
  type="date"
  value={newContract.startDate}
  onChange={e => setNewContract({
    ...newContract,
    startDate: e.target.value
  })}
  required
/>

        <label>יום תשלום בחודש</label>
        <input
          type="number"
          min="1"
          max="28"
          value={newContract.dueDay}
          onChange={e => setNewContract({
            ...newContract,
            dueDay: e.target.value
          })}
          required
        />

        <button type="submit">שמור חוזה</button>
      </form>
    )}

    {drivers.length === 0 && (
      <p>אין נהגים במערכת. יש להוסיף נהג לפני יצירת חוזה.</p>
    )}

    <h3>רשימת חוזי שכירות</h3>

{contracts.length === 0 ? (
  <p className="empty-message">עדיין לא נוצרו חוזים.</p>
) : (
  <div className="table-wrap contracts-table-wrap">
    <table>
      <thead>
        <tr>
          <th>נהג</th>
          <th>שכירות חודשית</th>
          <th>פיקדון</th>
          <th>יום תשלום</th>
          <th>סטטוס</th>
          <th>פעולה</th>
        </tr>
      </thead>
      <tbody>
        {contracts.map(contract => (
          <tr key={contract.id}>
            <td>{contract.driverName}</td>
            <td>
  {(() => {
    const vehicle = vehicles.find(
      v => Number(v.id) === Number(contract.vehicleId)
    )

    return vehicle
      ? `${vehicle.name} | ${vehicle.plate}`
      : 'לא משויך רכב'
  })()}
</td>
            <td>{contract.monthly.toLocaleString('he-IL')} ₪</td>
            <td>{contract.deposit.toLocaleString('he-IL')} ₪</td>
            <td>{contract.dueDay}</td>
            <td>{contractStatus(contract)}</td>
            <td>
              {contractStatus(contract) !== 'שולם' && (
                <button onClick={() => markPaid(contract.id)}>
                  סמן כשולם
                </button>
                )}
{contract.active !== false && (
  <button
    onClick={() => {
      if (window.confirm('האם לסיים את חוזה השכירות?')) {
        endContract(contract.id)
      }
    }}
  >
    סיום חוזה
  </button>
)}
<button
  className="cancel-button"
  onClick={() => deleteContract(contract.id)}
>
  מחיקת חוזה
</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
  </section>
)}


        <footer>Taxi Manager © 2026 | מערכת ניהול השכרת מוניות</footer>
      </main>
    </div>
  )
}

export default App


