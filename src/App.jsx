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
const [editingContractId, setEditingContractId] = useState(null)

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
  const [selectedContractId, setSelectedContractId] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [reportMonth, setReportMonth] = useState(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})
const [monthOpen, setMonthOpen] = useState(false)
const [yearOpen, setYearOpen] = useState(false)
const reportContracts = contracts.filter(contract => {
  const startMonth = contract.startDate?.slice(0, 7) || ''
  const endMonth = contract.endedAt?.slice(0, 7) || ''

  if (startMonth && startMonth > reportMonth) return false
  if (endMonth && endMonth < reportMonth) return false

  return true
})

const collectedIncome = reportContracts.reduce((sum, contract) => {
  const payments = contract.payments || []

  return sum + payments
    .filter(payment => payment.month === reportMonth)
    .reduce((total, payment) => total + Number(payment.amount || 0), 0)
}, 0)

const expectedIncome = reportContracts.reduce(
  (sum, contract) => sum + Number(contract.monthly || 0),
  0
)

const unpaidIncome = reportContracts.reduce((total, contract) => {
  const paid = (contract.payments || [])
    .filter(payment => payment.month === reportMonth)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  const balance = Number(contract.monthly || 0) - paid

  return total + Math.max(0, balance)
}, 0)

const currentMonthCollected = contracts.reduce((sum, contract) => {
  return sum + (contract.payments || [])
    .filter(p => p.month === currentMonth())
    .reduce((total, p) => total + Number(p.amount || 0), 0)
}, 0)
const currentMonthExpected = contracts
  .filter(c => c.active !== false)
  .reduce((sum, c) => sum + Number(c.monthly || 0), 0)

const currentMonthUnpaid = Math.max(
  0,
  currentMonthExpected - currentMonthCollected
)
const currentMonthLateContracts = contracts.filter(contract => {
  if (contract.active === false) return false

  const paid = (contract.payments || [])
    .filter(p => p.month === currentMonth())
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const balance = Number(contract.monthly || 0) - paid

  return balance > 0 &&
    new Date().getDate() > Number(contract.dueDay)
})
const overdueContracts = reportContracts.filter(contract => {
  const wasPaid = (contract.payments || []).some(
    payment => payment.month === reportMonth
  )

  if (wasPaid) return false

  const today = new Date()
  const thisMonth = currentMonth()

  return reportMonth < thisMonth ||
    (reportMonth === thisMonth && today.getDate() > Number(contract.dueDay))
})

const overdueIncome = overdueContracts.reduce(
  (sum, contract) => sum + Number(contract.monthly || 0),
  0
)
const reportYear = reportMonth.slice(0, 4)

const monthNames = [
  'ינו', 'פבר', 'מרץ', 'אפר',
  'מאי', 'יוני', 'יולי', 'אוג',
  'ספט', 'אוק', 'נוב', 'דצמ'
]

const annualIncome = monthNames.map((monthName, index) => {
  const month = `${reportYear}-${String(index + 1).padStart(2, '0')}`

  const total = contracts.reduce((sum, contract) => {
    const payments = contract.payments || []

    return sum + payments
      .filter(payment => payment.month === month)
      .reduce((paymentSum, payment) =>
        paymentSum + Number(payment.amount || 0), 0)
  }, 0)

  return {
    month: monthName,
    total
  }
})

const maxAnnualIncome = Math.max(
  ...annualIncome.map(item => item.total),
  1
)

  const [showForm, setShowForm] = useState(false)

  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    idNumber: '',
    vehicleId: '',
    price: '',
  })

  const [editingDriverId, setEditingDriverId] = useState(null)

  const [newContract, setNewContract] = useState({
  driverId: '',
  monthly: '',
  deposit: '',
  startDate: '',
  endDate: '',
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
  async function saveDriver(e) {
  e.preventDefault()

  const oldDriver = drivers.find(d => d.id === editingDriverId)

  const driver = {
    ...newDriver,
    id: editingDriverId ?? Date.now(),
    vehicleId: newDriver.vehicleId ? Number(newDriver.vehicleId) : null,
    price: Number(newDriver.price),
    active: oldDriver ? oldDriver.active : true
  }

  const conflict = drivers.find(d =>
    d.id !== driver.id &&
    d.active &&
    driver.vehicleId &&
    Number(d.vehicleId) === Number(driver.vehicleId)
  )

  if (conflict) {
    alert('הרכב כבר משויך לנהג פעיל אחר')
    return
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

  const activeContract = contracts.find(c =>
    Number(c.driverId) === Number(driver.id) &&
    c.active !== false
  )

  if (activeContract && Number(oldDriver?.vehicleId) !== Number(driver.vehicleId)) {
    const updatedContract = {
      ...activeContract,
      vehicleId: driver.vehicleId,
      driverName: driver.name
    }

    const { error: contractError } = await supabase
      .from('contracts')
      .upsert({
        id: String(updatedContract.id),
        data: updatedContract
      })

    if (contractError) {
      alert('הנהג נשמר, אך עדכון החוזה נכשל: ' + contractError.message)
      return
    }

    setContracts(prev => prev.map(c =>
      c.id === updatedContract.id ? updatedContract : c
    ))
  }

  if (oldDriver) {
    setDrivers(prev => prev.map(d =>
      d.id === driver.id ? driver : d
    ))
  } else {
    setDrivers(prev => [...prev, driver])
  }

  setVehicles(prev => prev.map(v => {
    if (driver.vehicleId && Number(v.id) === Number(driver.vehicleId)) {
      return {
        ...v,
        driver: driver.name,
        status: 'מושכר',
        price: driver.price
      }
    }

    if (
      oldDriver?.vehicleId &&
      Number(v.id) === Number(oldDriver.vehicleId) &&
      Number(oldDriver.vehicleId) !== Number(driver.vehicleId)
    ) {
      return { ...v, driver: '', status: 'פנוי' }
    }

    return v
  }))

  setNewDriver({
    name: '', phone: '', idNumber: '', vehicleId: '', price: ''
  })

  setEditingDriverId(null)
  setShowForm(false)
}

  function toggleDriver(id) {
    setDrivers(drivers.map(d =>
      d.id === id ? { ...d, active: !d.active } : d
    ))
  }

  function editDriver(driver) {
  setEditingDriverId(driver.id)

  setNewDriver({
    name: driver.name || '',
    phone: driver.phone || '',
    idNumber: driver.idNumber || '',
    vehicleId: driver.vehicleId ? String(driver.vehicleId) : '',
    price: driver.price ? String(driver.price) : '',
  })

  setShowForm(true)
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

function editContract(contract) {
  setEditingContractId(contract.id)

  setNewContract({
    driverId: String(contract.driverId),
    monthly: String(contract.monthly ?? ''),
    deposit: String(contract.deposit ?? ''),
    startDate: contract.startDate || '',
endDate: contract.endDate || '',
dueDay: String(contract.dueDay ?? '10')
  })

  setShowForm(true)
}

async function addContract(e) {
  e.preventDefault()

  const driver = drivers.find(
    d => d.id === Number(newContract.driverId)
  )

  if (!driver) return

  if (editingContractId !== null) {
  const existingContract = contracts.find(
    c => c.id === editingContractId
  )

  if (!existingContract) return

  const updatedContract = {
    ...existingContract,
    driverId: driver.id,
    driverName: driver.name,
    vehicleId: driver.vehicleId,
    monthly: Number(newContract.monthly),
    deposit: Number(newContract.deposit),
    startDate: newContract.startDate,
endDate: newContract.endDate,
dueDay: Number(newContract.dueDay)
  }

  const { error } = await supabase.from('contracts').upsert({
    id: String(updatedContract.id),
    data: updatedContract
  })

  if (error) {
    alert('שגיאה בעדכון החוזה: ' + error.message)
    return
  }

  setContracts(contracts.map(c =>
    c.id === updatedContract.id ? updatedContract : c
  ))

  setEditingContractId(null)
  setNewContract({
    driverId: '',
    monthly: '',
    deposit: '',
    startDate: '',
    dueDay: '10'
  })
  setShowForm(false)
  return
}

  const contract = {
    id: Date.now(),
    driverId: driver.id,
    driverName: driver.name,
    vehicleId: driver.vehicleId,
    monthly: Number(newContract.monthly),
    deposit: Number(newContract.deposit),
    startDate: newContract.startDate,
endDate: newContract.endDate,
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
    endDate: '',
    dueDay: '10'
  })

  setShowForm(false)
}

async function addPayment(id, amount) {
  const contract = contracts.find(c => String(c.id) === String(id))
  if (!contract) return

  const paymentAmount = Number(amount)

  if (!Number.isFinite(paymentAmount) || paymentAmount === 0) {
  alert('יש להזין סכום שאינו אפס')
  return
}

  const month = currentMonth()
  const payments = contract.payments || []

  const updatedContract = {
    ...contract,
    payments: [
      ...payments,
      {
        month,
        amount: paymentAmount,
        paidAt: new Date().toISOString()
      }
    ]
  }

  const { error } = await supabase
    .from('contracts')
    .upsert({
      id: String(id),
      data: updatedContract
    })

  if (error) {
    alert('שגיאה בשמירת התשלום: ' + error.message)
    return
  }

  setContracts(prev => prev.map(c =>
    String(c.id) === String(id) ? updatedContract : c
  ))

  alert('התשלום נשמר בהצלחה!')
}

function contractStatus(contract) {
  if (contract.active === false) return 'הסתיים'

  const month = currentMonth()
  const payments = (contract.payments || [])
    .filter(p => p.month === month)

  const paidAmount = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  )

  const monthlyAmount = Number(contract.monthly || 0)

  if (paidAmount >= monthlyAmount) return 'שולם'
  if (paidAmount > 0) return 'שולם חלקית'

  const today = new Date()

  if (today.getDate() > Number(contract.dueDay)) {
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
    endedAt: new Date().toISOString(),
    endDate: new Date().toISOString().slice(0, 10),
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

async function reactivateContract(id) {
  const contract = contracts.find(c => String(c.id) === String(id))
  if (!contract) return

  const updatedContract = {
    ...contract,
    active: true,
    endedAt: null
  }

  const { error } = await supabase
    .from('contracts')
    .upsert({
      id: String(id),
      data: updatedContract
    })

  if (error) {
    alert('שגיאה בהפעלת החוזה: ' + error.message)
    return
  }

  setContracts(prev => prev.map(c =>
    String(c.id) === String(id) ? updatedContract : c
  ))

  setVehicles(prev => prev.map(v =>
    Number(v.id) === Number(contract.vehicleId)
      ? { ...v, status: 'מושכר' }
      : v
  ))

  alert('החוזה הופעל מחדש בהצלחה')
}

async function uploadContractFile(contractId, file) {
  if (!file) return

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
const filePath = `${contractId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage
    .from('contract-files')
    .upload(filePath, file)

  if (error) {
    alert('שגיאה בהעלאת הקובץ: ' + error.message)
    return
  }

  const contract = contracts.find(c => c.id === contractId)

  const updatedContract = {
    ...contract,
    files: [...(contract.files || []), {
      name: file.name,
      path: filePath
    }]
  }

  const { error: saveError } = await supabase
    .from('contracts')
    .upsert({
      id: String(contractId),
      data: updatedContract
    })

  if (saveError) {
    alert('הקובץ הועלה, אך פרטי המסמך לא נשמרו: ' + saveError.message)
    return
  }

  setContracts(prev => prev.map(c =>
    c.id === contractId ? updatedContract : c
  ))

  alert('הקובץ הועלה בהצלחה')
}

async function openContractFile(path) {
  const { data, error } = await supabase.storage
    .from('contract-files')
    .createSignedUrl(path, 60)

  if (error) {
    alert('שגיאה בפתיחת המסמך: ' + error.message)
    return
  }

  window.open(data.signedUrl, '_blank')
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

<aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
  <button
  className="mobile-menu-toggle"
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  aria-label={mobileMenuOpen ? 'סגירת תפריט' : 'פתיחת תפריט'}
>
  {mobileMenuOpen ? '✕' : '☰'}
</button>
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
  setMobileMenuOpen(false)
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
{currentMonthLateContracts.length > 0 && (
  <section className="table-card">
    <div className="table-heading">
      <div>
        <h2>⚠️ תשלומים באיחור</h2>
        <p>נהגים שטרם השלימו את תשלום השכירות החודשית</p>
      </div>
      <span className="count">
        {currentMonthLateContracts.length} חוזים באיחור
      </span>
    </div>

    {currentMonthLateContracts.map(contract => {
      const paid = (contract.payments || [])
        .filter(p => p.month === currentMonth())
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)

      const balance = Number(contract.monthly || 0) - paid

      return (
        <div key={contract.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
          <button
  type="button"
  onClick={() => {
  setSelectedContractId(contract.id)
  setPage('contracts')
}}
  style={{
    border: 'none',
    background: 'none',
    color: '#f58220',
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecoration: 'underline'
  }}
>
  {contract.driverName}
</button>
          <span style={{ float: 'left', color: '#dc2626', fontWeight: 'bold' }}>
            יתרה: ₪{balance.toLocaleString('he-IL')}
          </span>
        </div>
      )
    })}
  </section>
)}
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
              <div className="stat-card">
  <div className="stat-icon green">💰</div>
  <p>התקבל בפועל החודש</p>
  <h2>₪{currentMonthCollected.toLocaleString('he-IL')}</h2>
  <small>סך התשלומים שהתקבלו</small>
</div>
<div className="stat-card">
  <div className="stat-icon orange">₪</div>
  <p>יתרה לגבייה החודש</p>
  <h2>₪{currentMonthUnpaid.toLocaleString('he-IL')}</h2>
  <small>סכום שטרם התקבל</small>
</div>
            </section>

            <section className="table-card">
              <div className="table-heading">
                <div>
                  <h2>ניהול חוזי שכירות</h2>
                  <p>מעקב וניהול הנהגים, הרכבים והתשלומים בעסק</p>
                </div>
                <span className="count">{vehicles.length} רכבים</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
  <tr>
    <th>נהג</th>
    <th>רכב</th>
    <th>שכירות חודשית</th>
    <th>יתרה לתשלום</th>
    <th>פיקדון</th>
    <th>יום תשלום</th>
    <th>סטטוס</th>
    <th>פעולות</th>
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
        <div className="contract-actions">
          {contract.active !== false && (
  <button
    className="contract-btn paid"
    onClick={() => {
      const amount = window.prompt('לתשלום רגיל הזן סכום חיובי. לתיקון טעות הזן סכום שלילי:')
      if (amount !== null && amount.trim() !== '') {
        addPayment(contract.id, amount)
      }
    }}
  >
    + הוסף תשלום
  </button>
)}

          {contract.active !== false && (
            <button
              className="contract-btn end"
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
            className="contract-btn delete"
            onClick={() => deleteContract(contract.id)}
          >
            מחיקת חוזה
          </button>
        </div>
      </td>
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
{editingDriverId !== null && (
  <button
    type="button"
    className="cancel-button"
    onClick={() => {
      setEditingDriverId(null)
      setNewDriver({
        name: '', phone: '', idNumber: '', vehicleId: '', price: ''
      })
      setShowForm(false)
    }}
  >
    ביטול
  </button>
)}
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
                onClick={() => {
  setShowForm(!showForm)
  setEditingContractId(null)
  setNewContract({
    driverId: '',
    monthly: '',
    deposit: '',
    startDate: '',
    dueDay: '10'
  })
}}>
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
                <h2>{editingDriverId !== null ? 'עריכת פרטי נהג' : 'הוספת נהג חדש'}</h2>
                <form onSubmit={saveDriver}>
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
  {editingDriverId !== null ? 'שמירת שינויים' : 'שמירת נהג'}
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
                      <th>יתרה לתשלום</th>
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
                        <td>
  {(() => {
    const driverContracts = contracts.filter(
      c => String(c.driverId) === String(d.id) && c.active !== false
    )

    const monthlyCharge = driverContracts.reduce(
      (sum, c) => sum + Number(c.monthly || 0), 0
    )

    const totalPaid = driverContracts.reduce((sum, c) => {
      return sum + (c.payments || [])
        .filter(p => p.month === currentMonth())
        .reduce((total, p) => total + Number(p.amount || 0), 0)
    }, 0)

    return `₪${Math.max(0, monthlyCharge - totalPaid).toLocaleString('he-IL')}`
  })()}
</td>
                        <td>{d.active ? 'פעיל' : 'לא פעיל'}</td>
                        <td>
                          <button className="status-button"
  onClick={() => editDriver(d)}>
  עריכה
</button>
{' '}
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
  <>
    <section className="welcome">
      <div>
        <h2>דוחות והכנסות 💰</h2>
        <p>מעקב אחר הכנסות, תשלומים וחובות לפי חודש.</p>
      </div>

      
<div className="report-period-picker">

  <div className="custom-period-select">
    <button
      type="button"
      className="period-trigger"
      onClick={() => {
        setMonthOpen(!monthOpen)
        setYearOpen(false)
      }}
    >
      {[
        'ינואר', 'פברואר', 'מרץ', 'אפריל',
        'מאי', 'יוני', 'יולי', 'אוגוסט',
        'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
      ][Number(reportMonth.slice(5, 7)) - 1]}
      <span>⌄</span>
    </button>

    {monthOpen && (
      <div className="period-options">
        {[
          'ינואר', 'פברואר', 'מרץ', 'אפריל',
          'מאי', 'יוני', 'יולי', 'אוגוסט',
          'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ].map((month, index) => {
          const value = String(index + 1).padStart(2, '0')
          return (
            <button
              type="button"
              key={value}
              className={reportMonth.slice(5, 7) === value ? 'selected' : ''}
              onClick={() => {
                setReportMonth(`${reportMonth.slice(0, 4)}-${value}`)
                setMonthOpen(false)
              }}
            >
              {month}
            </button>
          )
        })}
      </div>
    )}
  </div>

  <div className="custom-period-select">
    <button
      type="button"
      className="period-trigger"
      onClick={() => {
        setYearOpen(!yearOpen)
        setMonthOpen(false)
      }}
    >
      {reportMonth.slice(0, 4)}
      <span>⌄</span>
    </button>

    {yearOpen && (
      <div className="period-options">
        {Array.from({ length: 7 }, (_, i) => 2024 + i).map(year => (
          <button
            type="button"
            key={year}
            className={reportMonth.slice(0, 4) === String(year) ? 'selected' : ''}
            onClick={() => {
              setReportMonth(`${year}-${reportMonth.slice(5, 7)}`)
              setYearOpen(false)
            }}
          >
            {year}
          </button>
        ))}
      </div>
    )}
  </div>

    </div>
    </section>

    <section className="stats">
      <div className="stat-card">
        <div className="stat-icon green">₪</div>
        <p>הכנסות שהתקבלו</p>
<h2 style={{ color: '#16a34a' }}>
  ₪{collectedIncome.toLocaleString('he-IL')}
</h2>        <small>תשלומים שנרשמו בחודש הנבחר</small>
      </div>

      <div className="stat-card">
        <div className="stat-icon blue">📊</div>
        <p>הכנסה צפויה</p>
        <h2>₪{expectedIncome.toLocaleString('he-IL')}</h2>
        <small>לפי החוזים בחודש הנבחר</small>
      </div>

      <div className="stat-card">
        <div className="stat-icon orange">⏳</div>
        <p>טרם התקבלו</p>
<h2 style={{ color: '#dc2626' }}>
  ₪{unpaidIncome.toLocaleString('he-IL')}
</h2>        <small>יתרה שעדיין לא שולמה</small>
      </div>

      <div className="stat-card">
        <div className="stat-icon purple">⚠️</div>
        <p>חובות באיחור</p>
        <h2>₪{overdueIncome.toLocaleString('he-IL')}</h2>
        <small>{overdueContracts.length} חוזים באיחור</small>
      </div>
    </section>

    <section className="table-card">
      <h2>חוזים שטרם שולמו</h2>

            {reportContracts.filter(contract => {
        const paid = (contract.payments || [])
          .filter(payment => payment.month === reportMonth)
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

        return paid < Number(contract.monthly || 0)
      }).length === 0 ? (
        <p className="empty-message">
          כל התשלומים לחודש זה התקבלו.
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>שם הנהג</th>
<th>חיוב חודשי</th>
<th>שולם</th>
<th>יתרה לתשלום</th>
<th>יום תשלום</th>
<th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {reportContracts
                .filter(contract => {
  const paid = (contract.payments || [])
    .filter(payment => payment.month === reportMonth)
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  return paid < Number(contract.monthly || 0)
})
                .map(contract => (
                  <tr key={contract.id}>
  <td>{contract.driverName}</td>

  <td>
    ₪{Number(contract.monthly).toLocaleString('he-IL')}
  </td>

  <td>
    ₪{(contract.payments || [])
      .filter(payment => payment.month === reportMonth)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      .toLocaleString('he-IL')}
  </td>

  <td>
    ₪{Math.max(
      0,
      Number(contract.monthly || 0) -
      (contract.payments || [])
        .filter(payment => payment.month === reportMonth)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    ).toLocaleString('he-IL')}
  </td>

  <td>{contract.dueDay}</td>

  <td>
    {overdueContracts.some(c => c.id === contract.id)
      ? 'באיחור'
      : 'ממתין לתשלום'}
  </td>
</tr>
                  
                ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </>
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
      <form onSubmit={addContract} className="vehicle-form contract-form">
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
<input
  type="date"
  value={newContract.startDate}
  onChange={e => setNewContract({
    ...newContract,
    startDate: e.target.value
  })}
  required
/>
<label>תאריך סיום חוזה</label>
<input
  type="date"
  value={newContract.endDate}
  onChange={e => setNewContract({
    ...newContract,
    endDate: e.target.value
  })}
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

        <button type="submit">
  {editingContractId !== null ? 'עדכן חוזה' : 'שמור חוזה'}
</button>
      </form>
    )}

    {drivers.length === 0 && (
      <p>אין נהגים במערכת. יש להוסיף נהג לפני יצירת חוזה.</p>
    )}


<h3>רשימת חוזי שכירות</h3>
{selectedContractId !== null && (
  <button
    type="button"
    onClick={() => setSelectedContractId(null)}
  >
    הצג את כל החוזים
  </button>
)}
{contracts.length === 0 ? (
  <p className="empty-message">עדיין לא נוצרו חוזים.</p>
) : (
  <div className="contracts-list">
    {contracts
  .filter(contract =>
    selectedContractId === null ||
    String(contract.id) === String(selectedContractId)
  )
  .map(contract => {
      const vehicle = vehicles.find(
        v => Number(v.id) === Number(contract.vehicleId)
      )

      return (
        <div className="contract-card" key={contract.id}>
          <div className="contract-details">
            <div>
              <span>נהג</span>
              <strong>{contract.driverName}</strong>
            </div>

<div>
  <span>רכב</span>
  <strong className="vehicle-number" dir="rtl">
    {vehicle
      ? (
        <>
          {vehicle.name}
          <span dir="ltr" style={{ whiteSpace: 'nowrap' }}>
            {' | '}{vehicle.plate}
          </span>
        </>
      )
      : 'לא משויך רכב'}
  </strong>
</div>
            <div>
              <span>שכירות חודשית</span>
              <strong>
                ₪{Number(contract.monthly || 0).toLocaleString('he-IL')}
              </strong>
            </div>

            <div>
              <span>פיקדון</span>
              <strong>
                ₪{Number(contract.deposit || 0).toLocaleString('he-IL')}
              </strong>
            </div>

            <div>
              <span>יום תשלום</span>
              <strong>{contract.dueDay}</strong>
            </div>
<div>
  <span>תאריך תחילת חוזה</span>
  <strong>{contract.startDate || 'לא הוגדר'}</strong>
</div>

<div>
  <span>תאריך סיום חוזה</span>
  <strong>
    {contract.active === false
      ? (contract.endedAt
          ? new Date(contract.endedAt).toLocaleDateString('he-IL')
          : 'לא ידוע')
      : (contract.endDate || 'לא הוגדר')}
  </strong>
</div>
            <div>
              <span>סטטוס</span>
              <strong>{contract.active === false ? 'לא פעיל' : 'פעיל'}</strong>
            </div>
          </div>

          <div className="contract-action-bar">
            <button
  type="button"
  className="contract-btn"
  onClick={() => editContract(contract)}
>
  ✏️ עריכת חוזה
</button>
            {contract.active !== false && (
  <button
    className="contract-btn paid"
    onClick={() => {
      const amount = window.prompt('הזן את סכום התשלום שהתקבל:')
      if (amount !== null && amount.trim() !== '') {
        addPayment(contract.id, amount)
      }
    }}
  >
    + הוסף תשלום
  </button>
)}

            {contract.active !== false && (
              <button
                className="contract-btn end"
                onClick={() => {
                  if (window.confirm('האם לסיים את חוזה השכירות?')) {
                    endContract(contract.id)
                  }
                }}
              >
                סיום חוזה
              </button>
            )}

            {contract.active === false && (
  <button
    type="button"
    className="contract-btn paid"
    onClick={() => {
      if (window.confirm('האם להפעיל מחדש את החוזה?')) {
reactivateContract(contract.id)
      }
    }}
  >
    ↻ הפעל חוזה מחדש
  </button>
)}

            <label className="contract-btn upload">
              📎 העלאת מסמך
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                hidden
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) uploadContractFile(contract.id, file)
                  e.target.value = ''
                }}
              />
            </label>

            <button
              className="contract-btn delete"
              onClick={() => deleteContract(contract.id)}
            >
              🗑 מחיקת חוזה
            </button>
          </div>

          {(contract.files || []).length > 0 && (
            <div className="contract-documents">
              <strong>📁 מסמכי החוזה</strong>
              <div className="contract-files-list">
                {contract.files.map((file, index) => (
                  <button
                    key={index}
                    type="button"
                    className="contract-file"
                    onClick={() => openContractFile(file.path)}
                  >
                    📄 {file.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    })}
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


