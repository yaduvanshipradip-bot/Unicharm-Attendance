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
} from 'firebase/firestore';
import {
  UserPlus,
  LogOut,
  FileSpreadsheet,
  Users,
  Clock,
  CheckCircle2,
  UserCheck,
  Scan,
  Printer,
  Download,
} from 'lucide-react';

// TUMHARA FIREBASE CONFIG
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

interface Employee {
  name: string;
  empId: string;
  dept: string;
  qrData: string;
}
interface AttendanceRecord {
  empId: string;
  date: string;
  time: string;
  type: 'IN' | 'OUT';
}
interface User {
  id: string;
  password: string;
  role: 'admin' | 'hr' | 'guard';
}

export default function App() {
  const [role, setRole] = useState<'login' | 'admin' | 'hr' | 'guard'>('login');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const [hrPage, setHrPage] = useState<'home' | 'createEmp' | 'headcount'>(
    'home'
  );
  const [guardPage, setGuardPage] = useState<
    'home' | 'in' | 'out' | 'attendance' | 'headcount'
  >('home');
  const [guardSubPage, setGuardSubPage] = useState<
    '' | 'in-qr' | 'in-manual' | 'out-qr' | 'out-manual'
  >('');

  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserPass, setResetUserPass] = useState('');
  const [newEmp, setNewEmp] = useState({ name: '', empId: '', dept: '' });
  const [generatedQR, setGeneratedQR] = useState<Employee | null>(null);
  const [scanResult, setScanResult] = useState<{
    empId: string;
    type: string;
  } | null>(null);
  const [manualEmpId, setManualEmpId] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const cardPreviewRef = useRef<HTMLDivElement | null>(null);
  const COMPANY_NAME = 'Unicharm';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const empSnap = await getDocs(collection(db, 'employee'));
      setEmployees(empSnap.docs.map((d) => d.data() as Employee));

      const attSnap = await getDocs(collection(db, 'attendance'));
      setAttendance(attSnap.docs.map((d) => d.data() as AttendanceRecord));

      const userSnap = await getDocs(collection(db, 'users'));
      if (userSnap.empty) {
        await setDoc(doc(db, 'users', 'admin'), {
          id: 'Unicharm',
          password: 'Unicharm@123',
          role: 'admin',
        });
        setUsers([{ id: 'admin', password: '123', role: 'admin' }]);
      } else {
        setUsers(userSnap.docs.map((d) => d.data() as User));
      }
    } catch (error) {
      console.error('Firebase Error:', error);
      alert('Firebase se connect nahi ho pa raha. Rules check karo');
    } finally {
      setLoading(false); // <-- ye sabse jaruri hai
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    const q = query(
      collection(db, 'users'),
      where('id', '==', loginId),
      where('password', '==', loginPass)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const user = snap.docs[0].data() as User;
      setRole(user.role);
      if (user.role === 'guard') setGuardPage('home');
      if (user.role === 'hr') setHrPage('home');
      setLoginId('');
      setLoginPass('');
    } else {
      alert('Wrong User ID or Password');
    }
    setLoading(false);
  };

  const createUser = async (roleToCreate: 'guard' | 'hr') => {
    if (!newUserId || !newUserPass) return alert('Fill ID and Password');
    if (users.find((u) => u.id === newUserId))
      return alert('User ID already exists');
    const newUser = {
      id: newUserId,
      password: newUserPass,
      role: roleToCreate,
    };
    await setDoc(doc(db, 'users', newUserId), newUser);
    setUsers([...users, newUser]);
    alert(`${roleToCreate.toUpperCase()} user created successfully`);
    setNewUserId('');
    setNewUserPass('');
  };

  const resetPassword = async () => {
    if (!resetUserId || !resetUserPass) return alert('Fill ID and Password');
    if (!users.find((u) => u.id === resetUserId))
      return alert('User ID does not exist');
    await updateDoc(doc(db, 'users', resetUserId), { password: resetUserPass });
    setUsers(
      users.map((u) =>
        u.id === resetUserId ? { ...u, password: resetUserPass } : u
      )
    );
    alert('Password reset successful');
    setResetUserId('');
    setResetUserPass('');
  };

  const saveEmployee = async () => {
    if (!newEmp.name || !newEmp.empId || !newEmp.dept)
      return alert('All fields required');
    if (employees.find((e) => e.empId === newEmp.empId))
      return alert('Employee ID already exists');
    const empData: Employee = {
      ...newEmp,
      qrData: JSON.stringify({ empId: newEmp.empId, name: newEmp.name }),
    };
    await setDoc(doc(db, 'employee', newEmp.empId), empData);
    setEmployees([...employees, empData]);
    setGeneratedQR(empData);
    setNewEmp({ name: '', empId: '', dept: '' });
  };

  const triggerPrint = () => window.print();

  const downloadCardImage = (emp: Employee) => {
    const qrCanvas = document.getElementById(
      'employee-qr-canvas'
    ) as HTMLCanvasElement;
    if (!qrCanvas) return alert('QR Code canvas not ready');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = 260;
    const height = 380;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(COMPANY_NAME, width / 2, 32);
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('EMPLOYEE GATEPASS CARD', width / 2, 48);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, 58);
    ctx.lineTo(width - 15, 58);
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`Emp Code: ${emp.empId}`, width / 2, 80);
    ctx.fillText(`Name: ${emp.name}`, width / 2, 100);
    ctx.fillText(`Dept: ${emp.dept}`, width / 2, 120);
    const qrSize = 130;
    const qrX = (width - qrSize) / 2;
    const qrY = 145;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = `QR_Sticker_${emp.empId}.png`;
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
    if (!empExists) return alert('Employee ID not found in system');

    // VALIDATION: OUT se pehle IN hona chahiye
    if (type === 'OUT') {
      const todayRecords = attendance.filter(
        (a) => a.empId === empId && a.date === dateStr
      );
      const lastRecord = todayRecords[todayRecords.length - 1];
      if (!lastRecord || lastRecord.type !== 'IN') {
        setScanResult({ empId: 'Error', type: 'FIRST IN REQUIRED' });
        setShowPopup(true);
        return;
      }
    }

    const newRecord: AttendanceRecord = {
      empId,
      date: dateStr,
      time: timeStr,
      type,
    };
    await addDoc(collection(db, 'attendance'), newRecord);
    setAttendance([...attendance, newRecord]);
    setScanResult({ empId, type });
    setShowPopup(true);
    setManualEmpId('');
  };

  const startScanner = async (type: 'IN' | 'OUT') => {
    await stopScanner();
    setGuardSubPage(type === 'IN' ? 'in-qr' : 'out-qr');
    setTimeout(() => {
      const readerId = type === 'IN' ? 'reader-in' : 'reader-out';
      html5QrCodeRef.current = new Html5Qrcode(readerId);
      html5QrCodeRef.current
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              await markAttendance(data.empId, type);
              await html5QrCodeRef.current?.pause(); // bas pause, resume nahi
            } catch {
              alert('Invalid QR Code');
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
    const headers = ['Sr No', 'Emp ID', 'Employee Name', 'Department'];
    for (let day = 1; day <= daysInMonth; day++) {
      headers.push(day.toString());
      headers.push('');
    }
    headers.push('total');
    const data: any[] = [headers];
    employees.forEach((emp, index) => {
      const row = [index + 1, emp.empId, emp.name, emp.dept];
      let totalMonthMinutes = 0;
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
          row.push('');
          row.push('');
        } else if (inRec && outRec) {
          const mins = calculateWorkMinutes(inRec.time, outRec.time);
          totalMonthMinutes += mins;
          row.push(`IN ${inRec.time}\nOUT ${outRec.time}`);
          row.push(formatMinutes(mins));
        } else if (inRec) {
          row.push(`IN ${inRec.time}`);
          row.push('-');
        } else {
          row.push('A');
          row.push('-');
        }
      }
      row.push(formatMinutes(totalMonthMinutes));
      data.push(row);
    });
    const ws = XLSX.utils.aoa_to_sheet(data);
    const colWidths: any[] = [
      { wch: 6 },
      { wch: 10 },
      { wch: 20 },
      { wch: 14 },
    ];
    for (let day = 1; day <= daysInMonth; day++) {
      colWidths.push({ wch: 12 });
      colWidths.push({ wch: 8 });
    }
    colWidths.push({ wch: 12 });
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthName);
    XLSX.writeFile(wb, `Master_Attendance_${monthName}.xlsx`);
    alert('Master Sheet Downloaded Successfully');
  };

  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      color: '#000',
      fontFamily: 'system-ui',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoImage: {
      height: '40px',
      maxHeight: '40px',
      width: 'auto',
      maxWidth: '120px',
      objectFit: 'contain',
    },
    companyTitle: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '900',
      color: '#000000',
      letterSpacing: '-0.3px',
      lineHeight: '1.2',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      textAlign: 'right',
    },
    timeText: {
      fontSize: '15px',
      fontWeight: '900',
      color: '#000',
      fontFamily: 'monospace',
    },
    dateText: { fontSize: '12px', color: '#000', fontWeight: '700' },
    glassCard: {
      maxWidth: '380px',
      width: '100%',
      borderRadius: '24px',
      padding: '24px 20px',
      textAlign: 'left',
      boxSizing: 'border-box',
    },
    label: {
      fontSize: '13px',
      fontWeight: '900',
      color: '#000',
      display: 'block',
      marginBottom: '4px',
    },
    glassInput: {
      width: '100%',
      padding: '12px 14px',
      margin: '4px 0 16px 0',
      display: 'block',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      border: '2px solid #cbd5e1',
      borderRadius: '12px',
      fontSize: '15px',
      color: '#000',
      fontWeight: '900',
      outline: 'none',
      boxSizing: 'border-box',
      textAlign: 'left',
    },
    btnPrimary: {
      width: '100%',
      padding: '12px',
      margin: '8px 0 0 0',
      display: 'block',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      border: 'none',
      borderRadius: '12px',
      fontWeight: '800',
      fontSize: '14px',
      cursor: 'pointer',
    },
    btnSuccess: {
      width: '100%',
      padding: '12px',
      margin: '8px 0 0 0',
      display: 'block',
      backgroundColor: '#059669',
      color: '#ffffff',
      border: 'none',
      borderRadius: '12px',
      fontWeight: '800',
      fontSize: '14px',
      cursor: 'pointer',
    },
    btnSecondary: {
      width: '100%',
      padding: '12px',
      margin: '8px 0 0 0',
      display: 'block',
      backgroundColor: '#ffffff',
      color: '#000000',
      border: '2px solid #000',
      borderRadius: '12px',
      fontWeight: '900',
      fontSize: '14px',
      cursor: 'pointer',
    },
    toast: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)', // <-- center me
      zIndex: 1000,
      backgroundColor: '#ffffff',
      border: '2px solid #000',
      padding: '24px 28px',
      borderRadius: '20px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column', // <-- column kar diya
      alignItems: 'center',
      gap: '16px',
      minWidth: '280px',
    },
  };

  const dynamicContainerStyle: React.CSSProperties = {
    ...styles.container,
    backgroundImage: role === 'login' ? "url('/bg.jpg')" : '#f8fafc',
    backgroundColor: role === 'login' ? 'transparent' : '#f8fafc',
  };
  const dynamicCardStyle: React.CSSProperties = {
    ...styles.glassCard,
    backgroundColor: role === 'login' ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
    border:
      role === 'login'
        ? '2px solid rgba(255, 255, 255, 0.2)'
        : '1px solid #cbd5e1',
  };

  return (
    <div style={dynamicContainerStyle}>
      <style>{`@media print { @page { size: portrait; margin: 0; } body * { visibility: hidden!important; } #printable-card-area, #printable-card-area * { visibility: visible!important; } #printable-card-area { position: fixed!important; left: 10mm!important; top: 10mm!important; width: 260px!important; padding: 12px!important; border: 2px solid #000!important; background-color: #ffffff!important; } }`}</style>
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
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#000' }}>
              {scanResult.empId !== 'Error'
                ? `Emp ID: ${scanResult.empId}`
                : ''}
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
              html5QrCodeRef.current?.resume(); // <-- camera wapas chalu
            }}
            style={{ ...styles.btnPrimary, margin: 0, width: '120px' }}
          >
            OK
          </button>
        </div>
      )}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img
            src="/logo.png"
            alt="Logo"
            style={styles.logoImage}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <h1 style={styles.companyTitle}>{COMPANY_NAME}</h1>
        </div>
        <div style={styles.headerRight}>
          <div>
            <div style={styles.dateText}>
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
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
          padding: '20px 16px',
        }}
      >
        {loading && (
          <div
            style={{
              position: 'fixed',
              top: 50,
              background: '#fff',
              padding: '10px 20px',
              borderRadius: 10,
            }}
          >
            Loading...
          </div>
        )}
        {role === 'login' && (
          <div style={dynamicCardStyle}>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="User ID"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                style={styles.glassInput}
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                style={styles.glassInput}
              />
              <button type="submit" style={styles.btnPrimary}>
                Sign In
              </button>
            </form>
          </div>
        )}
        {role === 'admin' && (
          <div style={dynamicCardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #000',
                paddingBottom: '16px',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: '900',
                  margin: 0,
                  color: '#000',
                }}
              >
                Admin
              </h2>
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
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: '900',
                  marginBottom: '8px',
                  color: '#000',
                }}
              >
                Create User
              </h3>
              <input
                placeholder="New User ID"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                style={styles.glassInput}
              />
              <input
                type="password"
                placeholder="Password"
                value={newUserPass}
                onChange={(e) => setNewUserPass(e.target.value)}
                style={styles.glassInput}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => createUser('hr')}
                  style={{ ...styles.btnPrimary, width: '48%' }}
                >
                  HR
                </button>
                <button
                  onClick={() => createUser('guard')}
                  style={{ ...styles.btnSuccess, width: '48%' }}
                >
                  Security
                </button>
              </div>
              <hr
                style={{
                  border: 'none',
                  borderTop: '2px solid #000',
                  margin: '24px 0',
                }}
              />
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: '900',
                  marginBottom: '8px',
                  color: '#000',
                }}
              >
                Reset Password
              </h3>
              <input
                placeholder="User ID"
                value={resetUserId}
                onChange={(e) => setResetUserId(e.target.value)}
                style={styles.glassInput}
              />
              <input
                type="password"
                placeholder="New Password"
                value={resetUserPass}
                onChange={(e) => setResetUserPass(e.target.value)}
                style={styles.glassInput}
              />
              <button
                onClick={resetPassword}
                style={{ ...styles.btnPrimary, backgroundColor: '#d97706' }}
              >
                Reset Password
              </button>
            </div>
          </div>
        )}
        {role === 'hr' && (
          <div style={dynamicCardStyle}>
            {!generatedQR ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid #000',
                    paddingBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Users color="#2563eb" size={24} />
                    <h2
                      style={{
                        fontSize: '18px',
                        fontWeight: '900',
                        margin: 0,
                        color: '#000',
                      }}
                    >
                      HR Management
                    </h2>
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
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <button
                        onClick={() => setHrPage('createEmp')}
                        style={styles.btnSecondary}
                      >
                        <UserPlus size={18} /> Create Employee
                      </button>
                      <button
                        onClick={exportAttendance}
                        style={styles.btnSecondary}
                      >
                        <FileSpreadsheet size={18} /> Master Attendance
                      </button>
                      <button
                        onClick={() => setHrPage('headcount')}
                        style={styles.btnSecondary}
                      >
                        <UserCheck size={18} /> Head Count
                      </button>
                    </div>
                  )}
                  {hrPage === 'createEmp' && (
                    <div style={{ textAlign: 'left' }}>
                      <input
                        placeholder="Employee Name"
                        value={newEmp.name}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, name: e.target.value })
                        }
                        style={styles.glassInput}
                      />
                      <input
                        placeholder="Employee ID"
                        value={newEmp.empId}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, empId: e.target.value })
                        }
                        style={styles.glassInput}
                      />
                      <input
                        placeholder="Department"
                        value={newEmp.dept}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, dept: e.target.value })
                        }
                        style={styles.glassInput}
                      />
                      <button onClick={saveEmployee} style={styles.btnSuccess}>
                        Generate Employee
                      </button>
                      <button
                        onClick={() => setHrPage('home')}
                        style={styles.btnSecondary}
                      >
                        Back
                      </button>
                    </div>
                  )}
                  {hrPage === 'headcount' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div
                        style={{
                          fontSize: '14px',
                          color: '#000',
                          fontWeight: '900',
                        }}
                      >
                        Total Registered Employees
                      </div>
                      <div
                        style={{
                          fontSize: '48px',
                          fontWeight: '900',
                          color: '#2563eb',
                          margin: '10px 0',
                        }}
                      >
                        {employees.length}
                      </div>
                      <button
                        onClick={() => setHrPage('home')}
                        style={styles.btnSecondary}
                      >
                        Back
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div
                  id="printable-card-area"
                  ref={cardPreviewRef}
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '2px solid #000',
                    margin: '0 auto 16px auto',
                    textAlign: 'center',
                    width: '260px',
                  }}
                >
                  <h2
                    style={{
                      fontSize: '15px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                      color: '#000',
                    }}
                  >
                    {COMPANY_NAME}
                  </h2>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#000',
                      fontWeight: '900',
                      marginBottom: '10px',
                    }}
                  >
                    <div>
                      <b>Emp Code:</b> {generatedQR.empId}
                    </div>
                    <div>
                      <b>Name:</b> {generatedQR.name}
                    </div>
                    <div>
                      <b>Dept:</b> {generatedQR.dept}
                    </div>
                  </div>
                  <QRCodeCanvas
                    id="employee-qr-canvas"
                    value={generatedQR.qrData}
                    size={130}
                  />
                </div>
                <button
                  onClick={triggerPrint}
                  style={{ ...styles.btnPrimary, backgroundColor: '#4f46e5' }}
                >
                  <Printer size={18} />
                  Print
                </button>
                <button
                  onClick={() => downloadCardImage(generatedQR)}
                  style={styles.btnSuccess}
                >
                  <Download size={18} /> Download Sticker
                </button>
              </div>
            )}
          </div>
        )}
        {role === 'guard' && (
          <div style={dynamicCardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #000',
                paddingBottom: '16px',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: '900',
                  margin: 0,
                  color: '#000',
                }}
              >
                Security
              </h2>
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
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                    }}
                  >
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
                      style={{
                        ...styles.btnPrimary,
                        backgroundColor: '#dc2626',
                      }}
                    >
                      <Scan size={24} /> OUT
                    </button>
                  </div>
                  <button
                    onClick={() => setGuardPage('attendance')}
                    style={styles.btnSecondary}
                  >
                    <Clock size={18} /> Attendance Log
                  </button>
                  <button
                    onClick={() => setGuardPage('headcount')}
                    style={styles.btnSecondary}
                  >
                    <Users size={18} /> Headcount
                  </button>
                </div>
              )}
              {guardPage === 'in' && guardSubPage === '' && (
                <div>
                  <button
                    onClick={() => startScanner('IN')}
                    style={styles.btnSuccess}
                  >
                    Scan QR
                  </button>
                  <button
                    onClick={() => setGuardSubPage('in-manual')}
                    style={styles.btnSecondary}
                  >
                    Manual Entry
                  </button>
                  <button
                    onClick={() => setGuardPage('home')}
                    style={styles.btnSecondary}
                  >
                    Back
                  </button>
                </div>
              )}
              {guardPage === 'in' && guardSubPage === 'in-qr' && (
                <div>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: '900',
                      color: '#059669',
                    }}
                  >
                    Scanning QR (IN)
                  </h3>
                  <div
                    id="reader-in"
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid #059669',
                    }}
                  ></div>
                  <button onClick={stopScanner} style={styles.btnSecondary}>
                    Close Camera
                  </button>
                </div>
              )}
              {guardPage === 'in' && guardSubPage === 'in-manual' && (
                <div style={{ textAlign: 'left' }}>
                  <input
                    placeholder="Employee ID"
                    value={manualEmpId}
                    onChange={(e) => setManualEmpId(e.target.value)}
                    style={styles.glassInput}
                  />
                  <button
                    onClick={() => markAttendance(manualEmpId, 'IN')}
                    style={styles.btnSuccess}
                  >
                    IN
                  </button>
                  <button
                    onClick={() => {
                      setGuardSubPage('');
                      setGuardPage('in');
                    }}
                    style={styles.btnSecondary}
                  >
                    Back
                  </button>
                </div>
              )}
              {guardPage === 'out' && guardSubPage === '' && (
                <div>
                  <button
                    onClick={() => startScanner('OUT')}
                    style={{ ...styles.btnPrimary, backgroundColor: '#dc2626' }}
                  >
                    Scan QR
                  </button>
                  <button
                    onClick={() => setGuardSubPage('out-manual')}
                    style={styles.btnSecondary}
                  >
                    Manual OUT
                  </button>
                  <button
                    onClick={() => setGuardPage('home')}
                    style={styles.btnSecondary}
                  >
                    Back
                  </button>
                </div>
              )}
              {guardPage === 'out' && guardSubPage === 'out-qr' && (
                <div>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: '900',
                      color: '#dc2626',
                    }}
                  >
                    Scanning QR (OUT)
                  </h3>
                  <div
                    id="reader-out"
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid #dc2626',
                    }}
                  ></div>
                  <button onClick={stopScanner} style={styles.btnSecondary}>
                    Close Camera
                  </button>
                </div>
              )}
              {guardPage === 'out' && guardSubPage === 'out-manual' && (
                <div style={{ textAlign: 'left' }}>
                  <input
                    placeholder="Employee ID"
                    value={manualEmpId}
                    onChange={(e) => setManualEmpId(e.target.value)}
                    style={styles.glassInput}
                  />
                  <button
                    onClick={() => markAttendance(manualEmpId, 'OUT')}
                    style={{ ...styles.btnPrimary, backgroundColor: '#dc2626' }}
                  >
                    OUT
                  </button>
                  <button
                    onClick={() => {
                      setGuardSubPage('');
                      setGuardPage('out');
                    }}
                    style={styles.btnSecondary}
                  >
                    Back
                  </button>
                </div>
              )}
              {guardPage === 'attendance' && (
                <div>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: '900',
                      marginBottom: '12px',
                    }}
                  >
                    Today's Log
                  </h3>

                  {(() => {
                    const todayData = attendance
                      .filter(
                        (a) => a.date === new Date().toISOString().split('T')[0]
                      )
                      .reverse();

                    const totalPages = Math.ceil(
                      todayData.length / ITEMS_PER_PAGE
                    );
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const currentItems = todayData.slice(
                      startIndex,
                      startIndex + ITEMS_PER_PAGE
                    );

                    return (
                      <>
                        {currentItems.length === 0 ? (
                          <div
                            style={{
                              textAlign: 'center',
                              padding: '20px',
                              color: '#666',
                            }}
                          >
                            No records today
                          </div>
                        ) : (
                          currentItems.map((a, i) => {
                            const emp = employees.find(
                              (e) => e.empId === a.empId
                            );
                            return (
                              <div
                                key={i}
                                style={{
                                  padding: '10px',
                                  border: '1px solid #000',
                                  margin: '6px 0',
                                  borderRadius: 8,
                                  background:
                                    a.type === 'IN' ? '#ecfdf5' : '#fef2f2',
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: '900',
                                    fontSize: '14px',
                                  }}
                                >
                                  {emp?.name || 'Unknown'} - {a.empId}
                                </div>
                                <div
                                  style={{ fontSize: '12px', color: '#555' }}
                                >
                                  Dept: {emp?.dept || '-'} | Time: {a.time}
                                </div>
                                <div
                                  style={{
                                    fontWeight: '900',
                                    color:
                                      a.type === 'IN' ? '#059669' : '#dc2626',
                                    fontSize: '13px',
                                  }}
                                >
                                  {a.type}
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* PAGINATION BUTTONS */}
                        {totalPages > 1 && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              justifyContent: 'center',
                              marginTop: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <button
                              onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                              }
                              style={{
                                ...styles.btnSecondary,
                                width: 'auto',
                                padding: '6px 12px',
                              }}
                            >
                              Prev
                            </button>
                            {Array.from(
                              { length: totalPages },
                              (_, i) => i + 1
                            ).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{
                                  ...styles.btnSecondary,
                                  width: 'auto',
                                  padding: '6px 12px',
                                  backgroundColor:
                                    currentPage === page ? '#2563eb' : '#fff',
                                  color: currentPage === page ? '#fff' : '#000',
                                }}
                              >
                                {page}
                              </button>
                            ))}
                            <button
                              onClick={() =>
                                setCurrentPage((p) =>
                                  Math.min(totalPages, p + 1)
                                )
                              }
                              style={{
                                ...styles.btnSecondary,
                                width: 'auto',
                                padding: '6px 12px',
                              }}
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
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#000',
                      fontWeight: '900',
                    }}
                  >
                    Employees Currently IN
                  </div>
                  <div
                    style={{
                      fontSize: '48px',
                      fontWeight: '900',
                      color: '#059669',
                      margin: '10px 0',
                    }}
                  >
                    {getHeadCount()}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#555',
                      marginBottom: '16px',
                    }}
                  >
                    Total Staff: {employees.length}
                  </div>
                  <button
                    onClick={() => setGuardPage('home')}
                    style={styles.btnSecondary}
                  >
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