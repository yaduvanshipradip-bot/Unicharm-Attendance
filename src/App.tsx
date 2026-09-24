import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import {
  UserPlus,
  UserMinus,
  LogOut,
  FileSpreadsheet,
  Users,
  Clock,
  CheckCircle2,
  UserCheck,
  Scan,
  Printer,
  Download,
  Eye,
  EyeOff,
  QrCode,
  Building2,
  Smartphone,
} from 'lucide-react';

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: 'AIzaSyB0CSGyhhMSWq4JGbm80UcQjkgoBsdF4js',
  authDomain: 'unicharm-attendence.firebaseapp.com',
  projectId: 'unicharm-attendence',
  storageBucket: 'unicharm-attendence.firebasestorage.app',
  messagingSenderId: '860892336745',
  appId: '1:860892336745:web:6e6fa7d49bc8c94ecb48f8',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// CONSTANT LIMITS
const MAX_HR_USERS = 5;
const MAX_GUARD_USERS = 5;
const MAX_EMPLOYEES = 500;

interface Company {
  id: string; // Unique slug (e.g., 'tata-motors', 'sharma-factory')
  name: string;
  createdAt: string;
}

interface Employee {
  companyId: string;
  name: string;
  empId: string;
  dept: string;
  qrData: string;
}

interface AttendanceRecord {
  companyId: string;
  empId: string;
  date: string;
  time: string;
  type: 'IN' | 'OUT';
}

interface User {
  id: string;
  companyId: string;
  password: string;
  role: 'admin' | 'hr' | 'guard';
}

export default function App() {
  const [role, setRole] = useState<'login' | 'admin' | 'hr' | 'guard'>('login');
  const [authMode, setAuthMode] = useState<'login' | 'registerCompany'>('login');

  // Multi-tenant Company State
  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('GatePass Pro');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // HR & Guard pages
  const [hrPage, setHrPage] = useState<'home' | 'createEmp' | 'removeEmp' | 'reprintEmp' | 'headcount'>('home');
  const [guardPage, setGuardPage] = useState<'home' | 'in' | 'out' | 'attendance' | 'headcount'>('home');
  const [guardSubPage, setGuardSubPage] = useState<'' | 'in-qr' | 'in-manual' | 'out-qr' | 'out-manual'>('');

  // Password visibility states
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showNewUserPass, setShowNewUserPass] = useState(false);
  const [showResetUserPass, setShowResetUserPass] = useState(false);

  // Form states
  const [loginCompanyId, setLoginCompanyId] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // New Company Registration Form
  const [regCompanyId, setRegCompanyId] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regAdminPass, setRegAdminPass] = useState('');

  // Admin user manage states
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserPass, setResetUserPass] = useState('');

  // HR states
  const [newEmp, setNewEmp] = useState({ name: '', empId: '', dept: '' });
  const [removeEmpId, setRemoveEmpId] = useState('');
  const [reprintEmpId, setReprintEmpId] = useState('');
  const [generatedQR, setGeneratedQR] = useState<Employee | null>(null);

  // Guard states
  const [scanResult, setScanResult] = useState<{ empId: string; type: string } | null>(null);
  const [manualEmpId, setManualEmpId] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const cardPreviewRef = useRef<HTMLDivElement | null>(null);
  const isScanningRef = useRef(false);
  const attendanceRef = useRef(attendance);

  useEffect(() => {
    attendanceRef.current = attendance;
  }, [attendance]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    } else {
      alert('Aap browser ke 3 dots par click karke "Add to Home Screen" ya "Install App" kar sakte hain.');
    }
  };

  // LOAD DATA FOR CURRENT LOGGED-IN COMPANY ONLY
  const loadCompanyData = async (activeCompanyId: string) => {
    setLoading(true);
    try {
      // 1. Fetch Company Profile
      const compDoc = await getDoc(doc(db, 'companies', activeCompanyId));
      if (compDoc.exists()) {
        const cData = compDoc.data() as Company;
        setCompanyName(cData.name);
      }

      // 2. Fetch Employees of this Company
      const empQuery = query(collection(db, 'employee'), where('companyId', '==', activeCompanyId));
      const empSnap = await getDocs(empQuery);
      setEmployees(empSnap.docs.map((d) => d.data() as Employee));

      // 3. Fetch Attendance of this Company
      const attQuery = query(collection(db, 'attendance'), where('companyId', '==', activeCompanyId));
      const attSnap = await getDocs(attQuery);
      setAttendance(attSnap.docs.map((d) => d.data() as AttendanceRecord));

      // 4. Fetch Users of this Company
      const userQuery = query(collection(db, 'users'), where('companyId', '==', activeCompanyId));
      const userSnap = await getDocs(userQuery);
      setUsers(userSnap.docs.map((d) => d.data() as User));
    } catch (error) {
      console.error('Firebase Error:', error);
      alert('Error fetching company data. Check internet/Firebase rules.');
    } finally {
      setLoading(false);
    }
  };

  // REGISTER NEW COMPANY (SAAS SELF-ONBOARDING)
  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCompanyId = regCompanyId.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanCompanyId || !regCompanyName || !regAdminPass) {
      return alert('Saari fields fill karna zaroori hai!');
    }

    setLoading(true);
    try {
      const existingComp = await getDoc(doc(db, 'companies', cleanCompanyId));
      if (existingComp.exists()) {
        alert('Yeh Company ID pehle se li ja chuki hai. Koi doosri ID chunein.');
        setLoading(false);
        return;
      }

      // 1. Save Company
      const newCompany: Company = {
        id: cleanCompanyId,
        name: regCompanyName.trim(),
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'companies', cleanCompanyId), newCompany);

      // 2. Create Default Admin User
      const defaultAdmin: User = {
        id: 'admin',
        companyId: cleanCompanyId,
        password: regAdminPass,
        role: 'admin',
      };
      await setDoc(doc(db, 'users', `${cleanCompanyId}_admin`), defaultAdmin);

      alert(`Company registered successfully! Aapka User ID 'admin' hai.`);
      setCompanyId(cleanCompanyId);
      setCompanyName(newCompany.name);
      setRole('admin');
      await loadCompanyData(cleanCompanyId);
      setAuthMode('login');
    } catch (err) {
      console.error(err);
      alert('Company register karne mein problem aayi.');
    } finally {
      setLoading(false);
    }
  };

  // LOGIN HANDLER
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCompanyId = loginCompanyId.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanCompanyId || !loginId || !loginPass) {
      return alert('Company ID, User ID aur Password sab bharna zaroori hai');
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('companyId', '==', cleanCompanyId),
        where('id', '==', loginId),
        where('password', '==', loginPass)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const user = snap.docs[0].data() as User;
        setCompanyId(cleanCompanyId);
        setRole(user.role);
        await loadCompanyData(cleanCompanyId);

        if (user.role === 'guard') setGuardPage('home');
        if (user.role === 'hr') setHrPage('home');
        setLoginPass('');
      } else {
        alert('Galat Company ID, User ID ya Password!');
      }
    } catch (err) {
      console.error(err);
      alert('Login error. Rules check karein.');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (roleToCreate: 'guard' | 'hr') => {
    if (!newUserId || !newUserPass) return alert('Fill ID and Password');

    const currentHRCount = users.filter((u) => u.role === 'hr').length;
    const currentGuardCount = users.filter((u) => u.role === 'guard').length;

    if (roleToCreate === 'hr' && currentHRCount >= MAX_HR_USERS) {
      return alert(`LIMIT EXCEEDED: Maximum ${MAX_HR_USERS} HR users allowed.`);
    }

    if (roleToCreate === 'guard' && currentGuardCount >= MAX_GUARD_USERS) {
      return alert(`LIMIT EXCEEDED: Maximum ${MAX_GUARD_USERS} Security users allowed.`);
    }

    if (users.find((u) => u.id === newUserId)) {
      return alert('Yeh User ID is company mein pehle se maujood hai');
    }

    const newUser: User = {
      id: newUserId,
      companyId: companyId,
      password: newUserPass,
      role: roleToCreate,
    };
    await setDoc(doc(db, 'users', `${companyId}_${newUserId}`), newUser);
    setUsers([...users, newUser]);
    alert(`${roleToCreate.toUpperCase()} user ban gaya!`);
    setNewUserId('');
    setNewUserPass('');
  };

  const resetPassword = async () => {
    if (!resetUserId || !resetUserPass) return alert('Fill ID and Password');
    const existing = users.find((u) => u.id === resetUserId);
    if (!existing) return alert('User ID nahi mila');

    await updateDoc(doc(db, 'users', `${companyId}_${resetUserId}`), { password: resetUserPass });
    setUsers(users.map((u) => (u.id === resetUserId ? { ...u, password: resetUserPass } : u)));
    alert('Password successfully reset ho gaya');
    setResetUserId('');
    setResetUserPass('');
  };

  const saveEmployee = async () => {
    if (!newEmp.name || !newEmp.empId || !newEmp.dept) return alert('All fields required');

    if (employees.length >= MAX_EMPLOYEES) {
      return alert(`LIMIT EXCEEDED: Maximum ${MAX_EMPLOYEES} employees limit reached.`);
    }

    if (employees.find((e) => e.empId === newEmp.empId)) {
      return alert('Employee ID already exists');
    }

    const empData: Employee = {
      ...newEmp,
      companyId: companyId,
      qrData: JSON.stringify({ companyId: companyId, empId: newEmp.empId, name: newEmp.name }),
    };

    await setDoc(doc(db, 'employee', `${companyId}_${newEmp.empId}`), empData);
    setEmployees([...employees, empData]);
    setGeneratedQR(empData);
    setNewEmp({ name: '', empId: '', dept: '' });
  };

  const deleteEmployee = async () => {
    if (!removeEmpId) return alert('Please enter Employee ID');
    const empExists = employees.find((e) => e.empId === removeEmpId);
    if (!empExists) return alert('Employee ID not found');

    if (!window.confirm(`Are you sure you want to remove ${empExists.name} (${removeEmpId})?`)) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'employee', `${companyId}_${removeEmpId}`));
      setEmployees((prev) => prev.filter((e) => e.empId !== removeEmpId));
      alert('Employee removed successfully');
      setRemoveEmpId('');
      setHrPage('home');
    } catch (err) {
      console.error(err);
      alert('Error removing employee');
    } finally {
      setLoading(false);
    }
  };

  const handleReprintCard = () => {
    if (!reprintEmpId) return alert('Please enter Employee ID');
    const emp = employees.find((e) => e.empId === reprintEmpId);
    if (!emp) return alert('Employee ID not found in system!');

    setGeneratedQR(emp);
    setReprintEmpId('');
  };

  const triggerPrint = () => window.print();

  // DOWNLOAD STICKER IN 8cm x 6cm (WITH DYNAMIC COMPANY NAME)
  const downloadCardImage = (emp: Employee) => {
    const qrCanvas = document.getElementById('employee-qr-canvas') as HTMLCanvasElement;
    if (!qrCanvas) return alert('QR Code canvas not ready');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 600;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Outer Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    ctx.textAlign = 'center';

    // 1. Dynamic Company Name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(companyName.toUpperCase(), width / 2, 80);

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('OFFICIAL GATEPASS', width / 2, 115);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 135);
    ctx.lineTo(width - 40, 135);
    ctx.stroke();

    // 2. ID
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`ID: ${emp.empId}`, width / 2, 190);

    // 3. Name
    ctx.font = 'bold 26px sans-serif';
    const displayName = emp.name.length > 18 ? emp.name.substring(0, 18) + '..' : emp.name;
    ctx.fillText(`Name: ${displayName}`, width / 2, 245);

    // 4. Department
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`Dept: ${emp.dept}`, width / 2, 300);

    // 5. QR Code
    const qrSize = 340;
    const qrX = (width - qrSize) / 2;
    const qrY = 340;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Bottom Footer
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Authorized Gate Access', width / 2, 740);

    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = `${companyName}_Sticker_${emp.empId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const markAttendance = async (empId: string, type: 'IN' | 'OUT') => {
    if (!empId) return alert('Please enter or scan an Employee ID');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const empExists = employees.find((e) => e.empId === empId);
    if (!empExists) {
      alert('Employee ID is company ke record mein nahi mila!');
      return false;
    }

    const currentAttendance = attendanceRef.current;

    if (type === 'OUT') {
      const todayRecords = currentAttendance.filter(
        (a) => a.empId === empId && a.date === dateStr
      );
      const lastRecord = todayRecords[todayRecords.length - 1];
      if (!lastRecord || lastRecord.type !== 'IN') {
        setScanResult({ empId: 'Error', type: 'FIRST IN REQUIRED' });
        setShowPopup(true);
        return false;
      }
    }

    const newRecord: AttendanceRecord = {
      companyId: companyId,
      empId,
      date: dateStr,
      time: timeStr,
      type,
    };
    await addDoc(collection(db, 'attendance'), newRecord);
    setAttendance((prev) => [...prev, newRecord]);
    setScanResult({ empId, type });
    setShowPopup(true);
    setManualEmpId('');
    return true;
  };

  const startScanner = async (type: 'IN' | 'OUT') => {
    await stopScanner();
    setGuardSubPage(type === 'IN' ? 'in-qr' : 'out-qr');
    isScanningRef.current = false;

    setTimeout(() => {
      const readerId = type === 'IN' ? 'reader-in' : 'reader-out';
      html5QrCodeRef.current = new Html5Qrcode(readerId);
      html5QrCodeRef.current
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (isScanningRef.current) return;
            isScanningRef.current = true;

            try {
              const data = JSON.parse(decodedText);
              // Multi-tenant check: QR code must belong to this company
              if (data.companyId && data.companyId !== companyId) {
                alert('Warning: Yeh QR code doosri company ka hai!');
                isScanningRef.current = false;
                return;
              }
              await markAttendance(data.empId, type);
            } catch {
              alert('Invalid QR Code');
              isScanningRef.current = false;
            }
          },
          () => {}
        )
        .catch(() => alert('Camera permission denied'));
    }, 300);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {}
      html5QrCodeRef.current = null;
    }
    isScanningRef.current = false;
    setGuardSubPage('');
  };

  const getHeadCount = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter((a) => a.date === today);
    const status: Record<string, string> = {};
    todayAttendance.forEach((a) => {
      status[a.empId] = a.type;
    });
    return Object.values(status).filter((s) => s === 'IN').length;
  };

  const calculateWorkMinutes = (inTime: string, outTime: string): number => {
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    let diffMin = outH * 60 + outM - (inH * 60 + inM);
    if (diffMin < 0) diffMin += 24 * 60;
    return diffMin;
  };

  const formatMinutes = (totalMin: number): string => {
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return `${hrs}h ${mins}m`;
  };

  // DYNAMIC MASTER EXCEL EXPORT
  const exportAttendance = () => {
    if (employees.length === 0) return alert('No employees found');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = now.toLocaleString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
    const today = now.getDate();

    const titleRow = [`${companyName.toUpperCase()} - MASTER ATTENDANCE REGISTER`];
    const subTitleRow = [`Month: ${monthName}`, `Generated Date: ${now.toLocaleDateString('en-IN')}`];
    const emptyRow = [''];

    const headers = ['Sr No', 'Emp ID', 'Employee Name', 'Department'];
    for (let day = 1; day <= daysInMonth; day++) {
      headers.push(`Day ${day}`);
    }
    headers.push('Total Present');
    headers.push('Total Absent');
    headers.push('Total Duty Hours');

    const sheetData: any[] = [titleRow, subTitleRow, emptyRow, headers];

    employees.forEach((emp, index) => {
      const row = [index + 1, emp.empId, emp.name, emp.dept];
      let totalMonthMinutes = 0;
      let presentDaysCount = 0;
      let absentDaysCount = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
          day
        ).padStart(2, '0')}`;
        const dayRecords = attendance.filter(
          (a) => a.empId === emp.empId && a.date === dateStr
        );
        const inRec = dayRecords.find((r) => r.type === 'IN');
        const outRec = dayRecords.find((r) => r.type === 'OUT');

        if (day > today) {
          row.push('-');
        } else if (inRec && outRec) {
          const mins = calculateWorkMinutes(inRec.time, outRec.time);
          totalMonthMinutes += mins;
          const durationFormatted = formatMinutes(mins);

          if (mins >= 480) {
            presentDaysCount++;
            row.push(`🟢 IN:${inRec.time} OUT:${outRec.time} (${durationFormatted}) [8h+ OK]`);
          } else {
            absentDaysCount++;
            row.push(`🟡 IN:${inRec.time} OUT:${outRec.time} (${durationFormatted}) [<8h Short]`);
          }
        } else if (inRec) {
          absentDaysCount++;
          row.push(`🔴 IN:${inRec.time} (No OUT)`);
        } else {
          absentDaysCount++;
          row.push('A');
        }
      }

      row.push(`${presentDaysCount} Days`);
      row.push(`${absentDaysCount} Days`);
      row.push(formatMinutes(totalMonthMinutes));
      sheetData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    const colWidths: any[] = [{ wch: 8 }, { wch: 12 }, { wch: 22 }, { wch: 16 }];
    for (let day = 1; day <= daysInMonth; day++) {
      colWidths.push({ wch: 28 });
    }
    colWidths.push({ wch: 16 }, { wch: 16 }, { wch: 20 });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Register');
    XLSX.writeFile(wb, `${companyName.replace(/\s+/g, '_')}_Attendance_${monthName}.xlsx`);
    alert('Master Sheet Downloaded Successfully!');
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    companyTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '800',
      color: '#0f172a',
      letterSpacing: '-0.3px',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      textAlign: 'right',
    },
    timeText: {
      fontSize: '14px',
      fontWeight: '800',
      color: '#0f172a',
      fontFamily: 'monospace',
    },
    dateText: { fontSize: '11px', color: '#64748b', fontWeight: '600' },
    card: {
      maxWidth: '440px',
      width: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      padding: '24px 20px',
      textAlign: 'left',
      boxSizing: 'border-box',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    },
    inputContainer: {
      position: 'relative',
      width: '100%',
      margin: '6px 0 14px 0',
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      display: 'block',
      backgroundColor: '#f8fafc',
      border: '1.5px solid #cbd5e1',
      borderRadius: '10px',
      fontSize: '14px',
      color: '#0f172a',
      fontWeight: '700',
      outline: 'none',
      boxSizing: 'border-box',
    },
    eyeBtn: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#64748b',
      display: 'flex',
      alignItems: 'center',
      padding: 0,
    },
    btnPrimary: {
      width: '100%',
      padding: '12px',
      margin: '8px 0 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      fontWeight: '700',
      fontSize: '14px',
      cursor: 'pointer',
    },
    btnSuccess: {
      width: '100%',
      padding: '12px',
      margin: '8px 0 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      backgroundColor: '#059669',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      fontWeight: '700',
      fontSize: '14px',
      cursor: 'pointer',
    },
    btnDanger: {
      width: '100%',
      padding: '12px',
      margin: '8px 0 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      backgroundColor: '#dc2626',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      fontWeight: '700',
      fontSize: '14px',
      cursor: 'pointer',
    },
    btnSecondary: {
      width: '100%',
      padding: '12px',
      margin: '8px 0 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      backgroundColor: '#ffffff',
      color: '#0f172a',
      border: '1.5px solid #cbd5e1',
      borderRadius: '10px',
      fontWeight: '700',
      fontSize: '14px',
      cursor: 'pointer',
    },
    toast: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
      backgroundColor: '#ffffff',
      border: '2px solid #0f172a',
      padding: '24px 28px',
      borderRadius: '20px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      minWidth: '280px',
    },
  };

  const hrCount = users.filter((u) => u.role === 'hr').length;
  const guardCount = users.filter((u) => u.role === 'guard').length;

  return (
    <div style={styles.container}>
      {/* 8cm x 6cm STICKER PRINT STYLE */}
      <style>{`
        @media print {
          @page {
            size: 6cm 8cm;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-card-area, #printable-card-area * {
            visibility: visible !important;
          }
          #printable-card-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 6cm !important;
            height: 8cm !important;
            padding: 3mm !important;
            border: 2px solid #000 !important;
            background-color: #ffffff !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            text-align: center !important;
          }
        }
      `}</style>

      {/* Pop-up on Scan */}
      {showPopup && scanResult && (
        <div style={styles.toast}>
          <CheckCircle2
            color={
              scanResult.type === 'IN'
                ? '#059669'
                : scanResult.type === 'OUT'
                ? '#dc2626'
                : '#d97706'
            }
            size={48}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
              {scanResult.empId !== 'Error' ? `Emp ID: ${scanResult.empId}` : ''}
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '900',
                color:
                  scanResult.type === 'IN'
                    ? '#059669'
                    : scanResult.type === 'OUT'
                    ? '#dc2626'
                    : '#d97706',
                marginTop: '4px',
              }}
            >
              {scanResult.type === 'IN'
                ? 'CHECK-IN SUCCESS'
                : scanResult.type === 'OUT'
                ? 'CHECK-OUT SUCCESS'
                : 'FIRST CHECK-IN REQUIRED'}
            </div>
          </div>
          <button
            onClick={() => {
              setShowPopup(false);
              setTimeout(() => {
                isScanningRef.current = false;
              }, 600);
            }}
            style={{ ...styles.btnPrimary, margin: 0, width: '120px' }}
          >
            OK
          </button>
        </div>
      )}

      {/* Header Bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Building2 size={24} color="#2563eb" />
          <h1 style={styles.companyTitle}>{companyName}</h1>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={handleInstallClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#2563eb',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            <Smartphone size={14} /> Install App
          </button>
          <div>
            <div style={styles.dateText}>
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </div>
            <div style={styles.timeText}>
              {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
            </div>
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px 16px',
        }}
      >
        {loading && (
          <div
            style={{
              position: 'fixed',
              top: 50,
              background: '#0f172a',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: 30,
              zIndex: 100,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
              fontSize: '13px',
              fontWeight: '700',
            }}
          >
            Processing...
          </div>
        )}

        {/* AUTH SCREEN (LOGIN OR CREATE COMPANY) */}
        {role === 'login' && (
          <div style={styles.card}>
            {authMode === 'login' ? (
              <form onSubmit={handleLogin}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0' }}>Sign In</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Enter Company ID & Staff Credentials
                  </p>
                </div>

                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Company ID</label>
                <div style={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="e.g. sharma-tech"
                    value={loginCompanyId}
                    onChange={(e) => setLoginCompanyId(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>User ID</label>
                <div style={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="e.g. admin or guard1"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Password</label>
                <div style={styles.inputContainer}>
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="Password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    style={{ ...styles.input, paddingRight: '40px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    style={styles.eyeBtn}
                  >
                    {showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button type="submit" style={styles.btnPrimary}>
                  Sign In
                </button>

                <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Nayi company shuru karni hai? </span>
                  <button
                    type="button"
                    onClick={() => setAuthMode('registerCompany')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Register Company
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER COMPANY (SELF SERVE ONBOARDING) */
              <form onSubmit={handleRegisterCompany}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 6px 0' }}>Register Company</h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Create your workspace in 30 seconds
                  </p>
                </div>

                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Company Unique ID (No spaces)</label>
                <div style={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="e.g. sharma-builders"
                    value={regCompanyId}
                    onChange={(e) => setRegCompanyId(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Full Company Name</label>
                <div style={styles.inputContainer}>
                  <input
                    type="text"
                    placeholder="e.g. Sharma Builders & Infra Pvt Ltd"
                    value={regCompanyName}
                    onChange={(e) => setRegCompanyName(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Admin Master Password</label>
                <div style={styles.inputContainer}>
                  <input
                    type="password"
                    placeholder="Set Master Password"
                    value={regAdminPass}
                    onChange={(e) => setRegAdminPass(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>

                <button type="submit" style={styles.btnSuccess}>
                  Create Workspace
                </button>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    style={styles.btnSecondary}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ADMIN SCREEN */}
        {role === 'admin' && (
          <div style={styles.card}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '16px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Admin Panel</h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Company ID: {companyId}</div>
              </div>
              <button
                onClick={() => setRole('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#dc2626',
                }}
              >
                <LogOut size={22} />
              </button>
            </div>

            <div style={{ padding: '20px 0', textAlign: 'left' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>
                Create HR or Security User
              </h3>

              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px', fontWeight: 'bold' }}>
                HR Staff: {hrCount}/{MAX_HR_USERS} | Guard Staff: {guardCount}/{MAX_GUARD_USERS}
              </div>

              <div style={styles.inputContainer}>
                <input
                  placeholder="New User ID (e.g. guard_gate1)"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputContainer}>
                <input
                  type={showNewUserPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  style={{ ...styles.input, paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewUserPass(!showNewUserPass)}
                  style={styles.eyeBtn}
                >
                  {showNewUserPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => createUser('hr')} style={{ ...styles.btnPrimary, width: '48%' }}>
                  + HR User
                </button>
                <button onClick={() => createUser('guard')} style={{ ...styles.btnSuccess, width: '48%' }}>
                  + Guard User
                </button>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '24px 0' }} />

              <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>
                Reset User Password
              </h3>
              <div style={styles.inputContainer}>
                <input
                  placeholder="User ID"
                  value={resetUserId}
                  onChange={(e) => setResetUserId(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputContainer}>
                <input
                  type={showResetUserPass ? 'text' : 'password'}
                  placeholder="New Password"
                  value={resetUserPass}
                  onChange={(e) => setResetUserPass(e.target.value)}
                  style={{ ...styles.input, paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowResetUserPass(!showResetUserPass)}
                  style={styles.eyeBtn}
                >
                  {showResetUserPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                onClick={resetPassword}
                style={{ ...styles.btnPrimary, backgroundColor: '#d97706' }}
              >
                Update Password
              </button>
            </div>
          </div>
        )}

        {/* HR SCREEN */}
        {role === 'hr' && (
          <div style={styles.card}>
            {!generatedQR ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users color="#2563eb" size={24} />
                    <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>HR Management</h2>
                  </div>
                  <button
                    onClick={() => setRole('login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#dc2626',
                    }}
                  >
                    <LogOut size={22} />
                  </button>
                </div>

                <div style={{ padding: '20px 0' }}>
                  {hrPage === 'home' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button onClick={() => setHrPage('createEmp')} style={styles.btnPrimary}>
                        <UserPlus size={18} /> Add Employee ({employees.length}/{MAX_EMPLOYEES})
                      </button>
                      <button onClick={() => setHrPage('removeEmp')} style={styles.btnSecondary}>
                        <UserMinus size={18} /> Remove Employee
                      </button>
                      <button onClick={() => setHrPage('reprintEmp')} style={styles.btnSecondary}>
                        <QrCode size={18} /> Reprint Sticker
                      </button>
                      <button onClick={exportAttendance} style={styles.btnSuccess}>
                        <FileSpreadsheet size={18} /> Export Master Excel
                      </button>
                      <button onClick={() => setHrPage('headcount')} style={styles.btnSecondary}>
                        <UserCheck size={18} /> Headcount
                      </button>
                    </div>
                  )}

                  {hrPage === 'createEmp' && (
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>
                        Staff Added: {employees.length} / {MAX_EMPLOYEES}
                      </div>
                      <input
                        placeholder="Employee Name"
                        value={newEmp.name}
                        onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                        style={styles.input}
                      />
                      <input
                        placeholder="Employee ID"
                        value={newEmp.empId}
                        onChange={(e) => setNewEmp({ ...newEmp, empId: e.target.value })}
                        style={styles.input}
                      />
                      <input
                        placeholder="Department"
                        value={newEmp.dept}
                        onChange={(e) => setNewEmp({ ...newEmp, dept: e.target.value })}
                        style={styles.input}
                      />
                      <button onClick={saveEmployee} style={styles.btnSuccess}>
                        Generate Gatepass QR
                      </button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
                        Back
                      </button>
                    </div>
                  )}

                  {hrPage === 'removeEmp' && (
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#dc2626' }}>
                        Remove Employee
                      </h3>
                      <input
                        placeholder="Enter Employee ID"
                        value={removeEmpId}
                        onChange={(e) => setRemoveEmpId(e.target.value)}
                        style={styles.input}
                      />
                      <button onClick={deleteEmployee} style={styles.btnDanger}>
                        Delete Permanently
                      </button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
                        Back
                      </button>
                    </div>
                  )}

                  {hrPage === 'reprintEmp' && (
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Reprint QR Gatepass</h3>
                      <input
                        placeholder="Enter Employee ID"
                        value={reprintEmpId}
                        onChange={(e) => setReprintEmpId(e.target.value)}
                        style={styles.input}
                      />
                      <button onClick={handleReprintCard} style={styles.btnPrimary}>
                        Search & Display Sticker
                      </button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
                        Back
                      </button>
                    </div>
                  )}

                  {hrPage === 'headcount' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
                        Registered Staff in Database
                      </div>
                      <div style={{ fontSize: '48px', fontWeight: '900', color: '#2563eb', margin: '10px 0' }}>
                        {employees.length} <span style={{ fontSize: '16px', color: '#64748b' }}>/ {MAX_EMPLOYEES}</span>
                      </div>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
                        Back
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* DYNAMIC 8CM X 6CM STICKER PREVIEW */
              <div style={{ textAlign: 'center' }}>
                <div
                  id="printable-card-area"
                  ref={cardPreviewRef}
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '2px solid #000',
                    margin: '0 auto 16px auto',
                    textAlign: 'center',
                    width: '210px',
                    height: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        color: '#000',
                        lineHeight: '1.2',
                      }}
                    >
                      {companyName}
                    </div>
                    <div style={{ fontSize: '9px', color: '#2563eb', fontWeight: '800', marginTop: '2px' }}>
                      GATEPASS STICKER
                    </div>
                  </div>

                  <hr style={{ width: '90%', border: 'none', borderTop: '1px solid #cbd5e1', margin: '2px 0' }} />

                  <div style={{ fontSize: '11px', color: '#000', fontWeight: '800', lineHeight: '1.4', width: '100%' }}>
                    <div><b>ID:</b> {generatedQR.empId}</div>
                    <div><b>Name:</b> {generatedQR.name.length > 16 ? generatedQR.name.substring(0, 16) + '..' : generatedQR.name}</div>
                    <div><b>Dept:</b> {generatedQR.dept}</div>
                  </div>

                  <div style={{ margin: '4px 0' }}>
                    <QRCodeCanvas id="employee-qr-canvas" value={generatedQR.qrData} size={120} />
                  </div>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#059669', marginBottom: '10px' }}>
                  Standard Sticker Format: 8 cm x 6 cm (Portrait)
                </div>

                <button onClick={triggerPrint} style={{ ...styles.btnPrimary, backgroundColor: '#4f46e5' }}>
                  <Printer size={18} /> Print 8x6cm Sticker
                </button>
                <button onClick={() => downloadCardImage(generatedQR)} style={styles.btnSuccess}>
                  <Download size={18} /> Download Sticker Image
                </button>
                <button onClick={() => setGeneratedQR(null)} style={styles.btnSecondary}>
                  Back
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECURITY GATE SCREEN */}
        {role === 'guard' && (
          <div style={styles.card}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '16px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Gate Scanner</h2>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{companyName}</div>
              </div>
              <button
                onClick={() => setRole('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#dc2626',
                }}
              >
                <LogOut size={22} />
              </button>
            </div>

            <div style={{ padding: '20px 0' }}>
              {guardPage === 'home' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button
                      onClick={() => {
                        setGuardPage('in');
                        setGuardSubPage('');
                      }}
                      style={styles.btnSuccess}
                    >
                      <Scan size={24} /> IN
                    </button>
                    <button
                      onClick={() => {
                        setGuardPage('out');
                        setGuardSubPage('');
                      }}
                      style={styles.btnDanger}
                    >
                      <Scan size={24} /> OUT
                    </button>
                  </div>
                  <button onClick={() => setGuardPage('attendance')} style={styles.btnSecondary}>
                    <Clock size={18} /> Today's Log
                  </button>
                  <button onClick={() => setGuardPage('headcount')} style={styles.btnSecondary}>
                    <Users size={18} /> Live Inside
                  </button>
                </div>
              )}

              {guardPage === 'in' && guardSubPage === '' && (
                <div>
                  <button onClick={() => startScanner('IN')} style={styles.btnSuccess}>
                    Start QR Camera (IN)
                  </button>
                  <button onClick={() => setGuardSubPage('in-manual')} style={styles.btnSecondary}>
                    Manual ID Entry
                  </button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'in' && guardSubPage === 'in-qr' && (
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#059669', marginBottom: '8px' }}>
                    Scanning IN QR
                  </h3>
                  <div id="reader-in" style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #059669' }}></div>
                  <button onClick={stopScanner} style={styles.btnSecondary}>
                    Close Camera
                  </button>
                </div>
              )}

              {guardPage === 'in' && guardSubPage === 'in-manual' && (
                <div style={{ textAlign: 'left' }}>
                  <input
                    placeholder="Enter Employee ID"
                    value={manualEmpId}
                    onChange={(e) => setManualEmpId(e.target.value)}
                    style={styles.input}
                  />
                  <button onClick={() => markAttendance(manualEmpId, 'IN')} style={styles.btnSuccess}>
                    Mark IN
                  </button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'out' && guardSubPage === '' && (
                <div>
                  <button onClick={() => startScanner('OUT')} style={styles.btnDanger}>
                    Start QR Camera (OUT)
                  </button>
                  <button onClick={() => setGuardSubPage('out-manual')} style={styles.btnSecondary}>
                    Manual ID Entry
                  </button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'out' && guardSubPage === 'out-qr' && (
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#dc2626', marginBottom: '8px' }}>
                    Scanning OUT QR
                  </h3>
                  <div id="reader-out" style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #dc2626' }}></div>
                  <button onClick={stopScanner} style={styles.btnSecondary}>
                    Close Camera
                  </button>
                </div>
              )}

              {guardPage === 'out' && guardSubPage === 'out-manual' && (
                <div style={{ textAlign: 'left' }}>
                  <input
                    placeholder="Enter Employee ID"
                    value={manualEmpId}
                    onChange={(e) => setManualEmpId(e.target.value)}
                    style={styles.input}
                  />
                  <button onClick={() => markAttendance(manualEmpId, 'OUT')} style={styles.btnDanger}>
                    Mark OUT
                  </button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'attendance' && (
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px' }}>Today's Scans</h3>
                  {(() => {
                    const todayData = attendance
                      .filter((a) => a.date === new Date().toISOString().split('T')[0])
                      .reverse();

                    const totalPages = Math.ceil(todayData.length / ITEMS_PER_PAGE);
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const currentItems = todayData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                    return (
                      <>
                        {currentItems.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                            Aaj abhi tak koi punch nahi hua
                          </div>
                        ) : (
                          currentItems.map((a, i) => {
                            const emp = employees.find((e) => e.empId === a.empId);
                            return (
                              <div
                                key={i}
                                style={{
                                  padding: '10px',
                                  border: '1px solid #e2e8f0',
                                  margin: '6px 0',
                                  borderRadius: 8,
                                  background: a.type === 'IN' ? '#ecfdf5' : '#fef2f2',
                                  textAlign: 'left',
                                }}
                              >
                                <div style={{ fontWeight: '800', fontSize: '13px' }}>
                                  {emp?.name || 'Staff'} - {a.empId}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  Dept: {emp?.dept || '-'} | Time: {a.time}
                                </div>
                                <div
                                  style={{
                                    fontWeight: '800',
                                    color: a.type === 'IN' ? '#059669' : '#dc2626',
                                    fontSize: '12px',
                                  }}
                                >
                                  {a.type}
                                </div>
                              </div>
                            );
                          })
                        )}

                        {totalPages > 1 && (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
                            <button
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              style={{ ...styles.btnSecondary, width: 'auto', padding: '6px 12px' }}
                            >
                              Prev
                            </button>
                            <span style={{ fontSize: '12px', alignSelf: 'center' }}>
                              {currentPage} / {totalPages}
                            </span>
                            <button
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                              style={{ ...styles.btnSecondary, width: 'auto', padding: '6px 12px' }}
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <button
                    onClick={() => {
                      setGuardPage('home');
                      setCurrentPage(1);
                    }}
                    style={styles.btnSecondary}
                  >
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'headcount' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700' }}>
                    Currently Inside Factory/Office
                  </div>
                  <div style={{ fontSize: '48px', fontWeight: '900', color: '#059669', margin: '10px 0' }}>
                    {getHeadCount()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                    Total Enrolled: {employees.length}
                  </div>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
