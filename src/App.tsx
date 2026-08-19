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
const MAX_HR_USERS = 2;
const MAX_GUARD_USERS = 2;
const MAX_EMPLOYEES = 500;

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

  // HR & Guard pages
  const [hrPage, setHrPage] = useState<'home' | 'createEmp' | 'removeEmp' | 'reprintEmp' | 'headcount'>('home');
  const [guardPage, setGuardPage] = useState<'home' | 'in' | 'out' | 'attendance' | 'headcount'>('home');
  const [guardSubPage, setGuardSubPage] = useState<'' | 'in-qr' | 'in-manual' | 'out-qr' | 'out-manual'>('');

  // Password visibility states
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showNewUserPass, setShowNewUserPass] = useState(false);
  const [showResetUserPass, setShowResetUserPass] = useState(false);

  // Form states
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserPass, setResetUserPass] = useState('');
  const [newEmp, setNewEmp] = useState({ name: '', empId: '', dept: '' });
  const [removeEmpId, setRemoveEmpId] = useState('');
  const [reprintEmpId, setReprintEmpId] = useState('');
  const [generatedQR, setGeneratedQR] = useState<Employee | null>(null);
  const [scanResult, setScanResult] = useState<{ empId: string; type: string } | null>(null);
  const [manualEmpId, setManualEmpId] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const cardPreviewRef = useRef<HTMLDivElement | null>(null);
  const isScanningRef = useRef(false);
  const attendanceRef = useRef(attendance);

  const COMPANY_NAME = 'Unicharm';

  useEffect(() => {
    attendanceRef.current = attendance;
  }, [attendance]);

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
        await setDoc(doc(db, 'users', 'Unicharm'), {
          id: 'Unicharm',
          password: 'Unicharm@123',
          role: 'admin',
        });
        setUsers([{ id: 'Unicharm', password: 'Unicharm@123', role: 'admin' }]);
      } else {
        setUsers(userSnap.docs.map((d) => d.data() as User));
      }
    } catch (error) {
      console.error('Firebase Error:', error);
      alert('Firebase se connect nahi ho pa raha. Rules check karo');
    } finally {
      setLoading(false);
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

    const currentHRCount = users.filter((u) => u.role === 'hr').length;
    const currentGuardCount = users.filter((u) => u.role === 'guard').length;

    if (roleToCreate === 'hr' && currentHRCount >= MAX_HR_USERS) {
      return alert(`LIMIT EXCEEDED: Aap maximum ${MAX_HR_USERS} HR users hi bana sakte hain.`);
    }

    if (roleToCreate === 'guard' && currentGuardCount >= MAX_GUARD_USERS) {
      return alert(`LIMIT EXCEEDED: Aap maximum ${MAX_GUARD_USERS} Security users hi bana sakte hain.`);
    }

    if (users.find((u) => u.id === newUserId)) {
      return alert('User ID already exists');
    }

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

    if (employees.length >= MAX_EMPLOYEES) {
      return alert(`LIMIT EXCEEDED: Maximum ${MAX_EMPLOYEES} employees limit reached.`);
    }

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

  const deleteEmployee = async () => {
    if (!removeEmpId) return alert('Please enter Employee ID');
    const empExists = employees.find((e) => e.empId === removeEmpId);
    if (!empExists) return alert('Employee ID not found');

    if (!window.confirm(`Are you sure you want to remove ${empExists.name} (${removeEmpId})?`)) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'employee', removeEmpId));
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

  // DOWNLOAD STICKER IN PORTRAIT 4cm x 6cm RATIO (400px x 600px Canvas)
  const downloadCardImage = (emp: Employee) => {
    const qrCanvas = document.getElementById('employee-qr-canvas') as HTMLCanvasElement;
    if (!qrCanvas) return alert('QR Code canvas not ready');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas size for 4 cm width x 6 cm height
    const width = 400;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Outer Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    ctx.textAlign = 'center';

    // 1. Company Name
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(COMPANY_NAME.toUpperCase(), width / 2, 60);

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('EMPLOYEE GATEPASS CARD', width / 2, 85);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 100);
    ctx.lineTo(width - 30, 100);
    ctx.stroke();

    // 2. ID
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`ID: ${emp.empId}`, width / 2, 145);

    // 3. Name
    ctx.font = 'bold 20px sans-serif';
    const displayName = emp.name.length > 18 ? emp.name.substring(0, 18) + '..' : emp.name;
    ctx.fillText(`Name: ${displayName}`, width / 2, 190);

    // 4. Department
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Dept: ${emp.dept}`, width / 2, 235);

    // 5. QR Code
    const qrSize = 250;
    const qrX = (width - qrSize) / 2;
    const qrY = 275;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Bottom Footer
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Stick on back of ID Card', width / 2, 560);

    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = `Sticker_Portrait_4x6cm_${emp.empId}.png`;
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
      alert('Employee ID not found in system');
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

    const titleRow = [`${COMPANY_NAME.toUpperCase()} - MASTER ATTENDANCE REGISTER`];
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
          presentDaysCount++;
          const durationFormatted = formatMinutes(mins);

          if (mins >= 480) {
            row.push(`🟢 IN:${inRec.time} OUT:${outRec.time} (${durationFormatted}) [8h+ OK]`);
          } else {
            row.push(`🟡 IN:${inRec.time} OUT:${outRec.time} (${durationFormatted})`);
          }
        } else if (inRec) {
          presentDaysCount++;
          row.push(`IN:${inRec.time} (No OUT)`);
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

    const colWidths: any[] = [
      { wch: 8 },
      { wch: 12 },
      { wch: 22 },
      { wch: 16 },
    ];

    for (let day = 1; day <= daysInMonth; day++) {
      colWidths.push({ wch: 28 });
    }
    colWidths.push({ wch: 16 });
    colWidths.push({ wch: 16 });
    colWidths.push({ wch: 20 });

    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Register');
    XLSX.writeFile(wb, `${COMPANY_NAME}_Attendance_${monthName}.xlsx`);
    alert('Master Sheet Downloaded Successfully! (Green 🟢 = 8 Hours+ Completed)');
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
    glassInputContainer: {
      position: 'relative',
      width: '100%',
      margin: '4px 0 16px 0',
    },
    glassInput: {
      width: '100%',
      padding: '12px 40px 12px 14px',
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
    eyeBtn: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#475569',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
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
    btnDanger: {
      width: '100%',
      padding: '12px',
      margin: '8px 0 0 0',
      display: 'block',
      backgroundColor: '#dc2626',
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
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
      backgroundColor: '#ffffff',
      border: '2px solid #000',
      padding: '24px 28px',
      borderRadius: '20px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column',
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

  const hrCount = users.filter((u) => u.role === 'hr').length;
  const guardCount = users.filter((u) => u.role === 'guard').length;

  return (
    <div style={dynamicContainerStyle}>
      {/* PRINT STYLING STRICTLY FOR PORTRAIT 4CM X 6CM STICKER */}
      <style>{`
        @media print {
          @page {
            size: 4cm 6cm;
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
            width: 4cm !important;
            height: 6cm !important;
            padding: 2mm !important;
            border: 1px solid #000 !important;
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

      {/* Toast Popup on Scan */}
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
              zIndex: 100,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            }}
          >
            Loading...
          </div>
        )}

        {/* LOGIN SCREEN */}
        {role === 'login' && (
          <div style={dynamicCardStyle}>
            <form onSubmit={handleLogin}>
              <div style={styles.glassInputContainer}>
                <input
                  type="text"
                  placeholder="User ID"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  style={{ ...styles.glassInput, paddingRight: '14px' }}
                />
              </div>
              <div style={styles.glassInputContainer}>
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  style={styles.glassInput}
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
            </form>
          </div>
        )}

        {/* ADMIN SCREEN */}
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
                Admin Panel
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              </div>

              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '12px', fontWeight: 'bold' }}>
                HR Users: {hrCount}/{MAX_HR_USERS} | Security Users: {guardCount}/{MAX_GUARD_USERS}
              </div>

              <div style={styles.glassInputContainer}>
                <input
                  placeholder="New User ID"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  style={{ ...styles.glassInput, paddingRight: '14px' }}
                />
              </div>
              <div style={styles.glassInputContainer}>
                <input
                  type={showNewUserPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  style={styles.glassInput}
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
                <button
                  onClick={() => createUser('hr')}
                  style={{ ...styles.btnPrimary, width: '48%' }}
                >
                  HR ({hrCount}/{MAX_HR_USERS})
                </button>
                <button
                  onClick={() => createUser('guard')}
                  style={{ ...styles.btnSuccess, width: '48%' }}
                >
                  Security ({guardCount}/{MAX_GUARD_USERS})
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
              <div style={styles.glassInputContainer}>
                <input
                  placeholder="User ID"
                  value={resetUserId}
                  onChange={(e) => setResetUserId(e.target.value)}
                  style={{ ...styles.glassInput, paddingRight: '14px' }}
                />
              </div>
              <div style={styles.glassInputContainer}>
                <input
                  type={showResetUserPass ? 'text' : 'password'}
                  placeholder="New Password"
                  value={resetUserPass}
                  onChange={(e) => setResetUserPass(e.target.value)}
                  style={styles.glassInput}
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
                Reset Password
              </button>
            </div>
          </div>
        )}

        {/* HR SCREEN */}
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
                        <UserPlus size={18} /> Create Employee ({employees.length}/{MAX_EMPLOYEES})
                      </button>
                      <button
                        onClick={() => setHrPage('removeEmp')}
                        style={{ ...styles.btnSecondary, color: '#000000', borderColor: '#000000' }}
                      >
                        <UserMinus size={18} /> Remove Employee
                      </button>

                      <button
                        onClick={() => setHrPage('reprintEmp')}
                        style={{ ...styles.btnSecondary, backgroundColor: '#f8fafc' }}
                      >
                        <QrCode size={18} /> Reprint QR Card
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
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>
                        Total Employees Added: {employees.length} / {MAX_EMPLOYEES}
                      </div>
                      <input
                        placeholder="Employee Name"
                        value={newEmp.name}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, name: e.target.value })
                        }
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 16px 0' }}
                      />
                      <input
                        placeholder="Employee ID"
                        value={newEmp.empId}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, empId: e.target.value })
                        }
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 16px 0' }}
                      />
                      <input
                        placeholder="Department"
                        value={newEmp.dept}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, dept: e.target.value })
                        }
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 16px 0' }}
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

                  {hrPage === 'removeEmp' && (
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#dc2626', marginBottom: '10px' }}>
                        Remove Employee
                      </h3>
                      <input
                        placeholder="Enter Employee ID"
                        value={removeEmpId}
                        onChange={(e) => setRemoveEmpId(e.target.value)}
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 16px 0' }}
                      />
                      <button onClick={deleteEmployee} style={styles.btnDanger}>
                        Remove Employee
                      </button>
                      <button
                        onClick={() => setHrPage('home')}
                        style={styles.btnSecondary}
                      >
                        Back
                      </button>
                    </div>
                  )}

                  {hrPage === 'reprintEmp' && (
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#2563eb', marginBottom: '10px' }}>
                        Reprint QR Card
                      </h3>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                        Enter Employee ID to get their QR gatepass card again.
                      </div>
                      <input
                        placeholder="Enter Employee ID"
                        value={reprintEmpId}
                        onChange={(e) => setReprintEmpId(e.target.value)}
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 16px 0' }}
                      />
                      <button onClick={handleReprintCard} style={styles.btnPrimary}>
                        Search & Print Card
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
                        {employees.length} <span style={{ fontSize: '16px', color: '#64748b' }}>/ {MAX_EMPLOYEES}</span>
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
              /* CARD PREVIEW AREA - STRICTLY PORTRAIT 4CM X 6CM VERTICAL LAYOUT */
              <div style={{ textAlign: 'center' }}>
                <div
                  id="printable-card-area"
                  ref={cardPreviewRef}
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid #000',
                    margin: '0 auto 16px auto',
                    textAlign: 'center',
                    width: '160px', // Matches 4cm width
                    height: '240px', // Matches 6cm height
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* 1. Company Name */}
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      color: '#000',
                      lineHeight: '1.2',
                    }}
                  >
                    {COMPANY_NAME}
                  </div>

                  <div
                    style={{
                      fontSize: '7px',
                      color: '#2563eb',
                      fontWeight: '800',
                      marginBottom: '6px',
                    }}
                  >
                    EMPLOYEE GATEPASS CARD
                  </div>

                  <hr style={{ width: '90%', border: 'none', borderTop: '1px solid #cbd5e1', margin: '0 0 6px 0' }} />

                  {/* 2. ID, 3. Name, 4. Department */}
                  <div style={{ fontSize: '9px', color: '#000', fontWeight: '800', lineHeight: '1.4', width: '100%' }}>
                    <div><b>ID:</b> {generatedQR.empId}</div>
                    <div><b>Name:</b> {generatedQR.name.length > 14 ? generatedQR.name.substring(0, 14) + '..' : generatedQR.name}</div>
                    <div><b>Dept:</b> {generatedQR.dept}</div>
                  </div>

                  {/* 5. QR Code */}
                  <div style={{ marginTop: '8px' }}>
                    <QRCodeCanvas
                      id="employee-qr-canvas"
                      value={generatedQR.qrData}
                      size={95}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#059669', marginBottom: '10px' }}>
                  Portrait Sticker: 4 cm (W) x 6 cm (H)
                </div>

                <button
                  onClick={triggerPrint}
                  style={{ ...styles.btnPrimary, backgroundColor: '#4f46e5' }}
                >
                  <Printer size={18} /> Print 4x6cm Sticker
                </button>
                <button
                  onClick={() => downloadCardImage(generatedQR)}
                  style={styles.btnSuccess}
                >
                  <Download size={18} /> Download Sticker Image
                </button>
                <button
                  onClick={() => setGeneratedQR(null)}
                  style={styles.btnSecondary}
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECURITY SCREEN */}
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
                Security Gate
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
                    style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 16px 0' }}
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
                    style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 16px 0' }}
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