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
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
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
  Calendar,
  KeyRound,
  FileText,
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
const storage = getStorage(app);

const MAX_HR_USERS = 5;
const MAX_GUARD_USERS = 5;
const MAX_EMPLOYEES = 500;

interface Company {
  id: string;
  name: string;
  createdAt: string;
}

interface Employee {
  companyId: string;
  name: string;
  empId: string;
  dept: string;
  qrData: string;
  phone?: string;
  email?: string;
  address?: string;
  aadharNo?: string;
  panNo?: string;
  aadharDocUrl?: string;
  panDocUrl?: string;
}

interface AttendanceRecord {
  companyId: string;
  empId: string;
  date: string;
  time: string;
  type: 'IN' | 'OUT';
}

interface LeaveRequest {
  id?: string;
  companyId: string;
  empId: string;
  empName: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface User {
  id: string;
  companyId: string;
  password: string;
  role: 'admin' | 'hr' | 'guard' | 'employee';
}

export default function App() {
  const [role, setRole] = useState<'login' | 'admin' | 'hr' | 'guard' | 'employee'>('login');
  const [authMode, setAuthMode] = useState<'login' | 'registerCompany'>('login');

  const [companyId, setCompanyId] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('GatePass Pro');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentEmp, setCurrentEmp] = useState<Employee | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Tabs
  const [hrPage, setHrPage] = useState<'home' | 'createEmp' | 'removeEmp' | 'reprintEmp' | 'headcount' | 'leaves'>('home');
  const [guardPage, setGuardPage] = useState<'home' | 'in' | 'out' | 'attendance' | 'headcount'>('home');
  const [guardSubPage, setGuardSubPage] = useState<'' | 'in-qr' | 'in-manual' | 'out-qr' | 'out-manual'>('');
  const [empTab, setEmpTab] = useState<'attendance' | 'leaves' | 'kyc' | 'password'>('attendance');

  // Password visibility
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showNewUserPass, setShowNewUserPass] = useState(false);
  const [showResetUserPass, setShowResetUserPass] = useState(false);
  const [showEmpNewPass, setShowEmpNewPass] = useState(false);

  // Login inputs
  const [loginCompanyId, setLoginCompanyId] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register Company inputs
  const [regCompanyId, setRegCompanyId] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regAdminPass, setRegAdminPass] = useState('');

  // Admin staff management
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserPass, setResetUserPass] = useState('');

  // HR Employee inputs
  const [newEmp, setNewEmp] = useState({ name: '', empId: '', dept: '', initialPassword: '' });
  const [removeEmpId, setRemoveEmpId] = useState('');
  const [reprintEmpId, setReprintEmpId] = useState('');
  const [generatedQR, setGeneratedQR] = useState<Employee | null>(null);

  // Employee KYC Inputs
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empAddress, setEmpAddress] = useState('');
  const [empAadhar, setEmpAadhar] = useState('');
  const [empPan, setEmpPan] = useState('');
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);

  // Employee Leave Inputs
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [leaveReason, setLeaveReason] = useState('');

  // Employee Password Change
  const [empNewPassword, setEmpNewPassword] = useState('');

  // Guard inputs
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
        if (choice.outcome === 'accepted') setDeferredPrompt(null);
      });
    } else {
      alert('Aap browser ke 3 dots par click karke "Add to Home Screen" ya "Install App" kar sakte hain.');
    }
  };

  // LOAD DATA FOR COMPANY
  const loadCompanyData = async (activeCompanyId: string, loggedEmpId?: string) => {
    setLoading(true);
    try {
      const compDoc = await getDoc(doc(db, 'companies', activeCompanyId));
      if (compDoc.exists()) {
        const cData = compDoc.data() as Company;
        setCompanyName(cData.name);
      }

      // Employees
      const empQuery = query(collection(db, 'employee'), where('companyId', '==', activeCompanyId));
      const empSnap = await getDocs(empQuery);
      const loadedEmps = empSnap.docs.map((d) => d.data() as Employee);
      setEmployees(loadedEmps);

      if (loggedEmpId) {
        const found = loadedEmps.find((e) => e.empId.toLowerCase() === loggedEmpId.toLowerCase());
        if (found) {
          setCurrentEmp(found);
          setEmpPhone(found.phone || '');
          setEmpEmail(found.email || '');
          setEmpAddress(found.address || '');
          setEmpAadhar(found.aadharNo || '');
          setEmpPan(found.panNo || '');
        }
      }

      // Attendance
      const attQuery = query(collection(db, 'attendance'), where('companyId', '==', activeCompanyId));
      const attSnap = await getDocs(attQuery);
      setAttendance(attSnap.docs.map((d) => d.data() as AttendanceRecord));

      // Leaves
      const leaveQuery = query(collection(db, 'leaves'), where('companyId', '==', activeCompanyId));
      const leaveSnap = await getDocs(leaveQuery);
      setLeaves(leaveSnap.docs.map((d) => ({ ...d.data(), id: d.id } as LeaveRequest)));

      // Users
      const userQuery = query(collection(db, 'users'), where('companyId', '==', activeCompanyId));
      const userSnap = await getDocs(userQuery);
      setUsers(userSnap.docs.map((d) => d.data() as User));
    } catch (error) {
      console.error('Firebase Error:', error);
      alert('Data load karne mein error aayi.');
    } finally {
      setLoading(false);
    }
  };

  // REGISTER COMPANY
  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCompanyId = regCompanyId.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanCompanyId || !regCompanyName || !regAdminPass) {
      return alert('Sabhi fields bharna zaroori hai');
    }

    setLoading(true);
    try {
      const existingComp = await getDoc(doc(db, 'companies', cleanCompanyId));
      if (existingComp.exists()) {
        alert('Yeh Company ID pehle se li ja chuki hai.');
        setLoading(false);
        return;
      }

      const newCompany: Company = {
        id: cleanCompanyId,
        name: regCompanyName.trim(),
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'companies', cleanCompanyId), newCompany);

      const defaultAdmin: User = {
        id: 'admin',
        companyId: cleanCompanyId,
        password: regAdminPass.trim(),
        role: 'admin',
      };
      await setDoc(doc(db, 'users', `${cleanCompanyId}_admin`), defaultAdmin);

      alert(`Company Registered! User ID 'admin' se login karein.`);
      setCompanyId(cleanCompanyId);
      setCompanyName(newCompany.name);
      setRole('admin');
      await loadCompanyData(cleanCompanyId);
      setAuthMode('login');
    } catch (err) {
      console.error(err);
      alert('Error registering company.');
    } finally {
      setLoading(false);
    }
  };

  // BULLETPROOF LOGIN HANDLER
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCompanyId = loginCompanyId.trim().toLowerCase().replace(/\s+/g, '-');
    const cleanLoginId = loginId.trim();
    const cleanPass = loginPass.trim();

    if (!cleanCompanyId || !cleanLoginId || !cleanPass) {
      return alert('Company ID, User ID aur Password sab bharna zaroori hai');
    }

    setLoading(true);
    try {
      const userQuery = query(
        collection(db, 'users'),
        where('companyId', '==', cleanCompanyId)
      );
      const snap = await getDocs(userQuery);

      if (snap.empty) {
        alert(`Company ID '${cleanCompanyId}' nahi mili! Pehle company register karein.`);
        setLoading(false);
        return;
      }

      // Case-insensitive ID Match (E101 == e101)
      const foundUser = snap.docs
        .map((d) => d.data() as User)
        .find((u) => u.id.toLowerCase() === cleanLoginId.toLowerCase());

      if (!foundUser) {
        alert(`User ID '${cleanLoginId}' nahi mili! (Agar naya employee hai toh HR se password confirm karein)`);
        setLoading(false);
        return;
      }

      if (foundUser.password !== cleanPass) {
        alert('Password galat hai! Kripya sahi password dalein.');
        setLoading(false);
        return;
      }

      // Login Successful!
      setCompanyId(cleanCompanyId);
      setRole(foundUser.role);
      await loadCompanyData(cleanCompanyId, foundUser.role === 'employee' ? foundUser.id : undefined);

      if (foundUser.role === 'guard') setGuardPage('home');
      if (foundUser.role === 'hr') setHrPage('home');
      if (foundUser.role === 'employee') setEmpTab('attendance');
      setLoginPass('');
    } catch (err) {
      console.error(err);
      alert('Login technical error.');
    } finally {
      setLoading(false);
    }
  };

  // ADMIN CREATES HR / GUARD
  const createUser = async (roleToCreate: 'guard' | 'hr') => {
    const cleanUid = newUserId.trim();
    const cleanPass = newUserPass.trim();
    if (!cleanUid || !cleanPass) return alert('Fill ID and Password');

    const currentHRCount = users.filter((u) => u.role === 'hr').length;
    const currentGuardCount = users.filter((u) => u.role === 'guard').length;

    if (roleToCreate === 'hr' && currentHRCount >= MAX_HR_USERS) {
      return alert(`LIMIT EXCEEDED: Max ${MAX_HR_USERS} HR users allowed.`);
    }

    if (roleToCreate === 'guard' && currentGuardCount >= MAX_GUARD_USERS) {
      return alert(`LIMIT EXCEEDED: Max ${MAX_GUARD_USERS} Security users allowed.`);
    }

    if (users.find((u) => u.id.toLowerCase() === cleanUid.toLowerCase())) {
      return alert('User ID already exists in this company');
    }

    const newUser: User = {
      id: cleanUid,
      companyId: companyId,
      password: cleanPass,
      role: roleToCreate,
    };
    await setDoc(doc(db, 'users', `${companyId}_${cleanUid}`), newUser);
    setUsers([...users, newUser]);
    alert(`${roleToCreate.toUpperCase()} staff user created successfully!`);
    setNewUserId('');
    setNewUserPass('');
  };

  const resetPassword = async () => {
    const cleanUid = resetUserId.trim();
    const cleanPass = resetUserPass.trim();
    if (!cleanUid || !cleanPass) return alert('Fill ID and Password');

    const existing = users.find((u) => u.id.toLowerCase() === cleanUid.toLowerCase());
    if (!existing) return alert('User ID not found');

    await updateDoc(doc(db, 'users', `${companyId}_${existing.id}`), { password: cleanPass });
    setUsers(users.map((u) => (u.id === existing.id ? { ...u, password: cleanPass } : u)));
    alert('Password updated successfully!');
    setResetUserId('');
    setResetUserPass('');
  };

  // HR CREATES EMPLOYEE + LOGIN USER
  const saveEmployee = async () => {
    const cleanEmpId = newEmp.empId.trim();
    const cleanName = newEmp.name.trim();
    const cleanDept = newEmp.dept.trim();
    const cleanPass = newEmp.initialPassword.trim();

    if (!cleanName || !cleanEmpId || !cleanDept || !cleanPass) {
      return alert('Name, Emp ID, Dept aur Password sabhi zaroori hain!');
    }

    if (employees.length >= MAX_EMPLOYEES) {
      return alert(`Maximum ${MAX_EMPLOYEES} employees limit reached.`);
    }

    if (employees.find((e) => e.empId.toLowerCase() === cleanEmpId.toLowerCase())) {
      return alert(`Employee ID '${cleanEmpId}' pehle se exist karti hai!`);
    }

    setLoading(true);
    try {
      const empData: Employee = {
        name: cleanName,
        empId: cleanEmpId,
        dept: cleanDept,
        companyId: companyId,
        qrData: JSON.stringify({ companyId: companyId, empId: cleanEmpId, name: cleanName }),
      };

      // 1. Save in Employee Collection
      await setDoc(doc(db, 'employee', `${companyId}_${cleanEmpId}`), empData);

      // 2. Create Login in Users Collection
      const empUser: User = {
        id: cleanEmpId,
        companyId: companyId,
        password: cleanPass,
        role: 'employee',
      };
      await setDoc(doc(db, 'users', `${companyId}_${cleanEmpId}`), empUser);

      setEmployees([...employees, empData]);
      setUsers([...users, empUser]);
      setGeneratedQR(empData);
      setNewEmp({ name: '', empId: '', dept: '', initialPassword: '' });
      alert(`Success! Employee create ho gaya.\nLogin ID: ${cleanEmpId}\nPassword: ${cleanPass}`);
    } catch (err) {
      console.error(err);
      alert('Employee save karne mein error aayi.');
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async () => {
    if (!removeEmpId) return alert('Please enter Employee ID');
    const cleanId = removeEmpId.trim();
    const empExists = employees.find((e) => e.empId.toLowerCase() === cleanId.toLowerCase());
    if (!empExists) return alert('Employee ID not found');

    if (!window.confirm(`Are you sure you want to remove ${empExists.name}?`)) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'employee', `${companyId}_${empExists.empId}`));
      await deleteDoc(doc(db, 'users', `${companyId}_${empExists.empId}`));
      setEmployees((prev) => prev.filter((e) => e.empId !== empExists.empId));
      setUsers((prev) => prev.filter((u) => u.id !== empExists.empId));
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
    const cleanId = reprintEmpId.trim();
    const emp = employees.find((e) => e.empId.toLowerCase() === cleanId.toLowerCase());
    if (!emp) return alert('Employee ID not found in system!');

    setGeneratedQR(emp);
    setReprintEmpId('');
  };

  const triggerPrint = () => window.print();

  // 8cm x 6cm STICKER IMAGE DOWNLOAD
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

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    ctx.textAlign = 'center';
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

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`ID: ${emp.empId}`, width / 2, 190);

    ctx.font = 'bold 26px sans-serif';
    const displayName = emp.name.length > 18 ? emp.name.substring(0, 18) + '..' : emp.name;
    ctx.fillText(`Name: ${displayName}`, width / 2, 245);

    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`Dept: ${emp.dept}`, width / 2, 300);

    const qrSize = 340;
    const qrX = (width - qrSize) / 2;
    const qrY = 340;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

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

  // EMPLOYEE KYC SAVE
  const handleSaveKYC = async () => {
    if (!currentEmp) return;
    setLoading(true);

    try {
      let aadharUrl = currentEmp.aadharDocUrl || '';
      let panUrl = currentEmp.panDocUrl || '';

      if (aadharFile) {
        const aRef = storageRef(storage, `kyc/${companyId}_${currentEmp.empId}_aadhar`);
        await uploadBytes(aRef, aadharFile);
        aadharUrl = await getDownloadURL(aRef);
      }

      if (panFile) {
        const pRef = storageRef(storage, `kyc/${companyId}_${currentEmp.empId}_pan`);
        await uploadBytes(pRef, panFile);
        panUrl = await getDownloadURL(pRef);
      }

      const updatedEmpData: Employee = {
        ...currentEmp,
        phone: empPhone.trim(),
        email: empEmail.trim(),
        address: empAddress.trim(),
        aadharNo: empAadhar.trim(),
        panNo: empPan.trim(),
        aadharDocUrl: aadharUrl,
        panDocUrl: panUrl,
      };

      await updateDoc(doc(db, 'employee', `${companyId}_${currentEmp.empId}`), { ...updatedEmpData });
      setCurrentEmp(updatedEmpData);
      setEmployees(employees.map((e) => (e.empId === currentEmp.empId ? updatedEmpData : e)));
      alert('KYC & Documents successfully save ho gaye!');
    } catch (err) {
      console.error(err);
      alert('KYC details save karne mein error aayi.');
    } finally {
      setLoading(false);
    }
  };

  // EMPLOYEE LEAVE SUBMIT
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp) return;
    if (!leaveStart || !leaveEnd || !leaveReason) return alert('Dates aur reason bharein');

    setLoading(true);
    try {
      const newLeave: LeaveRequest = {
        companyId: companyId,
        empId: currentEmp.empId,
        empName: currentEmp.name,
        startDate: leaveStart,
        endDate: leaveEnd,
        type: leaveType,
        reason: leaveReason.trim(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'leaves'), newLeave);
      setLeaves([...leaves, { ...newLeave, id: docRef.id }]);
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      alert('Leave request submit ho gayi!');
    } catch (err) {
      console.error(err);
      alert('Leave apply nahi ho paayi.');
    } finally {
      setLoading(false);
    }
  };

  // HR APPROVE/REJECT LEAVE
  const handleUpdateLeaveStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'leaves', leaveId), { status });
      setLeaves(leaves.map((l) => (l.id === leaveId ? { ...l, status } : l)));
      alert(`Leave request ${status}!`);
    } catch (err) {
      console.error(err);
      alert('Error updating leave.');
    } finally {
      setLoading(false);
    }
  };

  // EMPLOYEE CHANGE PASSWORD
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = empNewPassword.trim();
    if (!currentEmp || !cleanPass) return alert('Naya password dalein');

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', `${companyId}_${currentEmp.empId}`), {
        password: cleanPass,
      });
      alert('Password badal gaya hai! Agli baar naye password se login karein.');
      setEmpNewPassword('');
    } catch (err) {
      console.error(err);
      alert('Password change nahi ho saka.');
    } finally {
      setLoading(false);
    }
  };

  // SCAN & PUNCH ATTENDANCE
  const markAttendance = async (empId: string, type: 'IN' | 'OUT') => {
    const cleanEmpId = empId.trim();
    if (!cleanEmpId) return alert('Please enter or scan an Employee ID');

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const empExists = employees.find((e) => e.empId.toLowerCase() === cleanEmpId.toLowerCase());
    if (!empExists) {
      alert('Employee ID is company mein nahi mila!');
      return false;
    }

    const currentAttendance = attendanceRef.current;
    if (type === 'OUT') {
      const todayRecords = currentAttendance.filter((a) => a.empId === empExists.empId && a.date === dateStr);
      const lastRecord = todayRecords[todayRecords.length - 1];
      if (!lastRecord || lastRecord.type !== 'IN') {
        setScanResult({ empId: 'Error', type: 'FIRST IN REQUIRED' });
        setShowPopup(true);
        return false;
      }
    }

    const newRecord: AttendanceRecord = { companyId, empId: empExists.empId, date: dateStr, time: timeStr, type };
    await addDoc(collection(db, 'attendance'), newRecord);
    setAttendance((prev) => [...prev, newRecord]);
    setScanResult({ empId: empExists.empId, type });
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

  // MASTER EXCEL EXPORT
  const exportAttendance = () => {
    if (employees.length === 0) return alert('No employees found');
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const today = now.getDate();

    const titleRow = [`${companyName.toUpperCase()} - MASTER ATTENDANCE REGISTER`];
    const subTitleRow = [`Month: ${monthName}`, `Generated Date: ${now.toLocaleDateString('en-IN')}`];
    const emptyRow = [''];

    const headers = ['Sr No', 'Emp ID', 'Employee Name', 'Department'];
    for (let day = 1; day <= daysInMonth; day++) {
      headers.push(`Day ${day}`);
    }
    headers.push('Total Present', 'Total Absent', 'Total Duty Hours');

    const sheetData: any[] = [titleRow, subTitleRow, emptyRow, headers];

    employees.forEach((emp, index) => {
      const row = [index + 1, emp.empId, emp.name, emp.dept];
      let totalMonthMinutes = 0;
      let presentDaysCount = 0;
      let absentDaysCount = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayRecords = attendance.filter((a) => a.empId === emp.empId && a.date === dateStr);
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
    for (let day = 1; day <= daysInMonth; day++) colWidths.push({ wch: 28 });
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
    },
    card: {
      maxWidth: '460px',
      width: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '20px',
      padding: '24px 20px',
      textAlign: 'left',
      boxSizing: 'border-box',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
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
      fontWeight: '600',
      outline: 'none',
      boxSizing: 'border-box',
      margin: '6px 0 14px 0',
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
      {/* Pop-up on Scan */}
      {showPopup && scanResult && (
        <div style={styles.toast}>
          <CheckCircle2
            color={scanResult.type === 'IN' ? '#059669' : scanResult.type === 'OUT' ? '#dc2626' : '#d97706'}
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
                color: scanResult.type === 'IN' ? '#059669' : scanResult.type === 'OUT' ? '#dc2626' : '#d97706',
                marginTop: '4px',
              }}
            >
              {scanResult.type === 'IN' ? 'CHECK-IN SUCCESS' : scanResult.type === 'OUT' ? 'CHECK-OUT SUCCESS' : 'FIRST CHECK-IN REQUIRED'}
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

      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={24} color="#2563eb" />
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{companyName}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'monospace' }}>
              {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
            </div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 16px' }}>
        {loading && (
          <div style={{ position: 'fixed', top: 50, background: '#0f172a', color: '#fff', padding: '10px 24px', borderRadius: 30, zIndex: 100, fontSize: '13px' }}>
            Processing...
          </div>
        )}

        {/* 1. LOGIN SCREEN */}
        {role === 'login' && (
          <div style={styles.card}>
            {authMode === 'login' ? (
              <form onSubmit={handleLogin}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>Workspace Sign In</h2>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Admin, HR, Security & Employee Login</p>
                </div>

                <label style={{ fontSize: '12px', fontWeight: '700' }}>Company ID</label>
                <input
                  placeholder="e.g. sharma-tech"
                  value={loginCompanyId}
                  onChange={(e) => setLoginCompanyId(e.target.value)}
                  style={styles.input}
                  required
                />

                <label style={{ fontSize: '12px', fontWeight: '700' }}>User ID / Employee ID</label>
                <input
                  placeholder="e.g. admin or EMP101"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  style={styles.input}
                  required
                />

                <label style={{ fontSize: '12px', fontWeight: '700' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    style={styles.input}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    style={{ position: 'absolute', right: 12, top: 18, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button type="submit" style={styles.btnPrimary}>Sign In</button>

                <div style={{ textAlign: 'center', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setAuthMode('registerCompany')}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Nayi Company Register Karein
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterCompany}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', textAlign: 'center' }}>Register Company</h2>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Unique Company ID</label>
                <input
                  placeholder="e.g. sharma-infra"
                  value={regCompanyId}
                  onChange={(e) => setRegCompanyId(e.target.value)}
                  style={styles.input}
                  required
                />
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Company Name</label>
                <input
                  placeholder="Full Business Name"
                  value={regCompanyName}
                  onChange={(e) => setRegCompanyName(e.target.value)}
                  style={styles.input}
                  required
                />
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Admin Password</label>
                <input
                  type="password"
                  placeholder="Set Password"
                  value={regAdminPass}
                  onChange={(e) => setRegAdminPass(e.target.value)}
                  style={styles.input}
                  required
                />
                <button type="submit" style={styles.btnSuccess}>Create Workspace</button>
                <button type="button" onClick={() => setAuthMode('login')} style={styles.btnSecondary}>Back to Login</button>
              </form>
            )}
          </div>
        )}

        {/* 2. EMPLOYEE SELF-SERVICE PORTAL */}
        {role === 'employee' && currentEmp && (
          <div style={{ ...styles.card, maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>{currentEmp.name}</h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Emp ID: {currentEmp.empId} | Dept: {currentEmp.dept}</div>
              </div>
              <button onClick={() => setRole('login')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                <LogOut size={22} />
              </button>
            </div>

            {/* Employee Tab Navigation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', margin: '14px 0' }}>
              <button
                onClick={() => setEmpTab('attendance')}
                style={{
                  ...styles.btnSecondary,
                  margin: 0,
                  padding: '8px 4px',
                  fontSize: '11px',
                  backgroundColor: empTab === 'attendance' ? '#2563eb' : '#fff',
                  color: empTab === 'attendance' ? '#fff' : '#0f172a',
                }}
              >
                Attendance
              </button>
              <button
                onClick={() => setEmpTab('leaves')}
                style={{
                  ...styles.btnSecondary,
                  margin: 0,
                  padding: '8px 4px',
                  fontSize: '11px',
                  backgroundColor: empTab === 'leaves' ? '#2563eb' : '#fff',
                  color: empTab === 'leaves' ? '#fff' : '#0f172a',
                }}
              >
                Leaves
              </button>
              <button
                onClick={() => setEmpTab('kyc')}
                style={{
                  ...styles.btnSecondary,
                  margin: 0,
                  padding: '8px 4px',
                  fontSize: '11px',
                  backgroundColor: empTab === 'kyc' ? '#2563eb' : '#fff',
                  color: empTab === 'kyc' ? '#fff' : '#0f172a',
                }}
              >
                KYC & Docs
              </button>
              <button
                onClick={() => setEmpTab('password')}
                style={{
                  ...styles.btnSecondary,
                  margin: 0,
                  padding: '8px 4px',
                  fontSize: '11px',
                  backgroundColor: empTab === 'password' ? '#2563eb' : '#fff',
                  color: empTab === 'password' ? '#fff' : '#0f172a',
                }}
              >
                Security
              </button>
            </div>

            {/* TAB 1: ATTENDANCE */}
            {empTab === 'attendance' && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>My Attendance Log</h3>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {attendance.filter((a) => a.empId === currentEmp.empId).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No punches recorded yet</div>
                  ) : (
                    attendance
                      .filter((a) => a.empId === currentEmp.empId)
                      .reverse()
                      .map((rec, i) => (
                        <div key={i} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', margin: '6px 0', background: rec.type === 'IN' ? '#ecfdf5' : '#fef2f2' }}>
                          <div style={{ fontWeight: '800', fontSize: '13px' }}>{rec.date} - {rec.time}</div>
                          <div style={{ fontWeight: '800', color: rec.type === 'IN' ? '#059669' : '#dc2626', fontSize: '12px' }}>PUNCH: {rec.type}</div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: LEAVES */}
            {empTab === 'leaves' && (
              <div>
                <form onSubmit={handleApplyLeave}>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>Apply For Leave</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>Start Date</label>
                      <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} style={styles.input} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>End Date</label>
                      <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} style={styles.input} required />
                    </div>
                  </div>
                  <label style={{ fontSize: '11px', fontWeight: '700' }}>Leave Type</label>
                  <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} style={styles.input}>
                    <option>Casual Leave</option>
                    <option>Sick Leave</option>
                    <option>Emergency Leave</option>
                  </select>
                  <label style={{ fontSize: '11px', fontWeight: '700' }}>Reason</label>
                  <input placeholder="Reason for leave" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} style={styles.input} required />
                  <button type="submit" style={styles.btnPrimary}>Submit Application</button>
                </form>

                <h4 style={{ fontSize: '13px', fontWeight: '800', marginTop: '16px' }}>My Applications</h4>
                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {leaves.filter((l) => l.empId === currentEmp.empId).map((l, i) => (
                    <div key={i} style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', margin: '4px 0', fontSize: '12px' }}>
                      <div><b>{l.type}</b> ({l.startDate} to {l.endDate})</div>
                      <div style={{ color: '#64748b' }}>Reason: {l.reason}</div>
                      <div style={{ fontWeight: '800', color: l.status === 'APPROVED' ? '#059669' : l.status === 'REJECTED' ? '#dc2626' : '#d97706' }}>
                        Status: {l.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: KYC */}
            {empTab === 'kyc' && (
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>Joining Details & Documents</h3>
                <label style={{ fontSize: '11px', fontWeight: '700' }}>Phone Number</label>
                <input value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} placeholder="Mobile Number" style={styles.input} />

                <label style={{ fontSize: '11px', fontWeight: '700' }}>Email Address</label>
                <input value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} placeholder="Email" style={styles.input} />

                <label style={{ fontSize: '11px', fontWeight: '700' }}>Residential Address</label>
                <input value={empAddress} onChange={(e) => setEmpAddress(e.target.value)} placeholder="Full Address" style={styles.input} />

                <label style={{ fontSize: '11px', fontWeight: '700' }}>Aadhar Card No</label>
                <input value={empAadhar} onChange={(e) => setEmpAadhar(e.target.value)} placeholder="12 Digit Aadhar" style={styles.input} />

                <label style={{ fontSize: '11px', fontWeight: '700' }}>Upload Aadhar (Photo / PDF)</label>
                <input type="file" onChange={(e) => setAadharFile(e.target.files ? e.target.files[0] : null)} style={styles.input} />
                {currentEmp.aadharDocUrl && <div style={{ fontSize: '11px', color: '#059669', marginBottom: '8px' }}>✓ Aadhar Uploaded</div>}

                <label style={{ fontSize: '11px', fontWeight: '700' }}>PAN Card No</label>
                <input value={empPan} onChange={(e) => setEmpPan(e.target.value)} placeholder="PAN Card No" style={styles.input} />

                <label style={{ fontSize: '11px', fontWeight: '700' }}>Upload PAN (Photo / PDF)</label>
                <input type="file" onChange={(e) => setPanFile(e.target.files ? e.target.files[0] : null)} style={styles.input} />
                {currentEmp.panDocUrl && <div style={{ fontSize: '11px', color: '#059669', marginBottom: '8px' }}>✓ PAN Uploaded</div>}

                <button onClick={handleSaveKYC} style={styles.btnSuccess}>Save KYC Details</button>
              </div>
            )}

            {/* TAB 4: PASSWORD */}
            {empTab === 'password' && (
              <form onSubmit={handleChangePassword}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>Change Account Password</h3>
                <label style={{ fontSize: '11px', fontWeight: '700' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showEmpNewPass ? 'text' : 'password'}
                    placeholder="Enter New Password"
                    value={empNewPassword}
                    onChange={(e) => setEmpNewPassword(e.target.value)}
                    style={styles.input}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmpNewPass(!showEmpNewPass)}
                    style={{ position: 'absolute', right: 12, top: 18, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showEmpNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button type="submit" style={styles.btnPrimary}>Update Password</button>
              </form>
            )}
          </div>
        )}

        {/* 3. HR CONTROL PANEL */}
        {role === 'hr' && (
          <div style={styles.card}>
            {!generatedQR ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>HR Control Panel</h2>
                  <button onClick={() => setRole('login')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                    <LogOut size={22} />
                  </button>
                </div>

                <div style={{ padding: '16px 0' }}>
                  {hrPage === 'home' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button onClick={() => setHrPage('createEmp')} style={styles.btnPrimary}>
                        <UserPlus size={18} /> Add Employee & Login Password
                      </button>
                      <button onClick={() => setHrPage('leaves')} style={{ ...styles.btnPrimary, backgroundColor: '#d97706' }}>
                        <Calendar size={18} /> Leave Approvals ({leaves.filter((l) => l.status === 'PENDING').length} Pending)
                      </button>
                      <button onClick={() => setHrPage('removeEmp')} style={styles.btnSecondary}>
                        <UserMinus size={18} /> Remove Employee
                      </button>
                      <button onClick={() => setHrPage('reprintEmp')} style={styles.btnSecondary}>
                        <QrCode size={18} /> Reprint Gatepass Sticker
                      </button>
                      <button onClick={exportAttendance} style={styles.btnSuccess}>
                        <FileSpreadsheet size={18} /> Master Attendance Excel
                      </button>
                      <button onClick={() => setHrPage('headcount')} style={styles.btnSecondary}>
                        <UserCheck size={18} /> Registered Staff ({employees.length})
                      </button>
                    </div>
                  )}

                  {/* HR ADD EMPLOYEE */}
                  {hrPage === 'createEmp' && (
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '800' }}>Add New Employee</h3>
                      <input placeholder="Full Name" value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} style={styles.input} />
                      <input placeholder="Employee ID (e.g. E101)" value={newEmp.empId} onChange={(e) => setNewEmp({ ...newEmp, empId: e.target.value })} style={styles.input} />
                      <input placeholder="Department" value={newEmp.dept} onChange={(e) => setNewEmp({ ...newEmp, dept: e.target.value })} style={styles.input} />
                      <input placeholder="Default Login Password (e.g. 123456)" value={newEmp.initialPassword} onChange={(e) => setNewEmp({ ...newEmp, initialPassword: e.target.value })} style={styles.input} />
                      <button onClick={saveEmployee} style={styles.btnSuccess}>Save & Generate Pass</button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>Back</button>
                    </div>
                  )}

                  {/* HR LEAVES */}
                  {hrPage === 'leaves' && (
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '10px' }}>Staff Leave Requests</h3>
                      {leaves.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No leave requests</div>
                      ) : (
                        leaves.map((l) => (
                          <div key={l.id} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', margin: '8px 0', fontSize: '12px' }}>
                            <div><b>{l.empName}</b> ({l.empId})</div>
                            <div style={{ color: '#2563eb', fontWeight: '700' }}>{l.type}: {l.startDate} to {l.endDate}</div>
                            <div style={{ color: '#475569' }}>Reason: {l.reason}</div>
                            <div style={{ marginTop: '6px' }}>Status: <b>{l.status}</b></div>
                            {l.status === 'PENDING' && (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button onClick={() => handleUpdateLeaveStatus(l.id!, 'APPROVED')} style={{ ...styles.btnSuccess, padding: '6px', fontSize: '11px', margin: 0 }}>
                                  Approve
                                </button>
                                <button onClick={() => handleUpdateLeaveStatus(l.id!, 'REJECTED')} style={{ ...styles.btnSecondary, color: '#dc2626', padding: '6px', fontSize: '11px', margin: 0 }}>
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>Back</button>
                    </div>
                  )}

                  {hrPage === 'removeEmp' && (
                    <div>
                      <input placeholder="Enter Employee ID" value={removeEmpId} onChange={(e) => setRemoveEmpId(e.target.value)} style={styles.input} />
                      <button onClick={deleteEmployee} style={styles.btnDanger}>Delete Employee</button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>Back</button>
                    </div>
                  )}

                  {hrPage === 'reprintEmp' && (
                    <div>
                      <input placeholder="Enter Employee ID" value={reprintEmpId} onChange={(e) => setReprintEmpId(e.target.value)} style={styles.input} />
                      <button onClick={handleReprintCard} style={styles.btnPrimary}>Search & View Sticker</button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>Back</button>
                    </div>
                  )}

                  {hrPage === 'headcount' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>Total Staff Enrolled</div>
                      <div style={{ fontSize: '48px', fontWeight: '900', color: '#2563eb' }}>{employees.length}</div>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>Back</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* QR GATEPASS CARD PREVIEW */
              <div style={{ textAlign: 'center' }}>
                <div style={{ padding: '16px', border: '2px solid #000', borderRadius: '12px', background: '#fff', margin: '0 auto 16px auto', width: '220px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '900' }}>{companyName}</div>
                  <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: '800' }}>GATEPASS QR</div>
                  <hr style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: '12px', fontWeight: '800' }}>ID: {generatedQR.empId}</div>
                  <div style={{ fontSize: '12px' }}>{generatedQR.name}</div>
                  <div style={{ margin: '10px 0' }}>
                    <QRCodeCanvas id="employee-qr-canvas" value={generatedQR.qrData} size={130} />
                  </div>
                </div>
                <button onClick={triggerPrint} style={{ ...styles.btnPrimary, backgroundColor: '#4f46e5' }}>Print 8x6cm Pass</button>
                <button onClick={() => downloadCardImage(generatedQR)} style={styles.btnSuccess}>Download Sticker Image</button>
                <button onClick={() => setGeneratedQR(null)} style={styles.btnSecondary}>Back</button>
              </div>
            )}
          </div>
        )}

        {/* 4. SECURITY GATE SCANNER */}
        {role === 'guard' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Gate Scanner</h2>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{companyName}</div>
              </div>
              <button onClick={() => setRole('login')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><LogOut size={22} /></button>
            </div>

            <div style={{ padding: '16px 0' }}>
              {guardPage === 'home' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button onClick={() => { setGuardPage('in'); setGuardSubPage(''); }} style={styles.btnSuccess}><Scan size={20} /> IN</button>
                    <button onClick={() => { setGuardPage('out'); setGuardSubPage(''); }} style={styles.btnDanger}><Scan size={20} /> OUT</button>
                  </div>
                  <button onClick={() => setGuardPage('attendance')} style={styles.btnSecondary}><Clock size={16} /> Today's Log</button>
                  <button onClick={() => setGuardPage('headcount')} style={styles.btnSecondary}><Users size={16} /> Inside Headcount</button>
                </div>
              )}

              {guardPage === 'in' && guardSubPage === '' && (
                <div>
                  <button onClick={() => startScanner('IN')} style={styles.btnSuccess}>Start QR Camera (IN)</button>
                  <button onClick={() => setGuardSubPage('in-manual')} style={styles.btnSecondary}>Manual ID IN</button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>Back</button>
                </div>
              )}

              {guardPage === 'in' && guardSubPage === 'in-qr' && (
                <div>
                  <div id="reader-in" style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #059669' }}></div>
                  <button onClick={stopScanner} style={styles.btnSecondary}>Close Camera</button>
                </div>
              )}

              {guardPage === 'in' && guardSubPage === 'in-manual' && (
                <div>
                  <input placeholder="Enter Employee ID" value={manualEmpId} onChange={(e) => setManualEmpId(e.target.value)} style={styles.input} />
                  <button onClick={() => markAttendance(manualEmpId, 'IN')} style={styles.btnSuccess}>Mark IN</button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>Back</button>
                </div>
              )}

              {guardPage === 'out' && guardSubPage === '' && (
                <div>
                  <button onClick={() => startScanner('OUT')} style={styles.btnDanger}>Start QR Camera (OUT)</button>
                  <button onClick={() => setGuardSubPage('out-manual')} style={styles.btnSecondary}>Manual ID OUT</button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>Back</button>
                </div>
              )}

              {guardPage === 'out' && guardSubPage === 'out-qr' && (
                <div>
                  <div id="reader-out" style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #dc2626' }}></div>
                  <button onClick={stopScanner} style={styles.btnSecondary}>Close Camera</button>
                </div>
              )}

              {guardPage === 'out' && guardSubPage === 'out-manual' && (
                <div>
                  <input placeholder="Enter Employee ID" value={manualEmpId} onChange={(e) => setManualEmpId(e.target.value)} style={styles.input} />
                  <button onClick={() => markAttendance(manualEmpId, 'OUT')} style={styles.btnDanger}>Mark OUT</button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>Back</button>
                </div>
              )}

              {guardPage === 'attendance' && (
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '800' }}>Today's Logs</h3>
                  {attendance.filter((a) => a.date === new Date().toISOString().split('T')[0]).map((a, i) => (
                    <div key={i} style={{ padding: '8px', border: '1px solid #e2e8f0', margin: '4px 0', borderRadius: '6px', fontSize: '12px' }}>
                      <b>{a.empId}</b> - {a.time} - <span style={{ color: a.type === 'IN' ? '#059669' : '#dc2626', fontWeight: '800' }}>{a.type}</span>
                    </div>
                  ))}
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>Back</button>
                </div>
              )}

              {guardPage === 'headcount' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Inside Premises Right Now</div>
                  <div style={{ fontSize: '48px', fontWeight: '900', color: '#059669' }}>{getHeadCount()}</div>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>Back</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. ADMIN CONTROL PANEL */}
        {role === 'admin' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Admin Panel</h2>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Workspace ID: {companyId}</div>
              </div>
              <button onClick={() => setRole('login')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}><LogOut size={22} /></button>
            </div>

            <div style={{ padding: '16px 0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800' }}>Add HR or Security Staff</h3>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                HR: {hrCount}/{MAX_HR_USERS} | Guards: {guardCount}/{MAX_GUARD_USERS}
              </div>
              <input placeholder="Staff User ID (e.g. hr_rahul)" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} style={styles.input} />
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewUserPass ? 'text' : 'password'}
                  placeholder="Set Password"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  style={styles.input}
                />
                <button type="button" onClick={() => setShowNewUserPass(!showNewUserPass)} style={styles.eyeBtn}>
                  {showNewUserPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => createUser('hr')} style={{ ...styles.btnPrimary, width: '50%' }}>+ HR Staff</button>
                <button onClick={() => createUser('guard')} style={{ ...styles.btnSuccess, width: '50%' }}>+ Guard Staff</button>
              </div>

              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

              <h3 style={{ fontSize: '14px', fontWeight: '800' }}>Reset Staff Password</h3>
              <input placeholder="Staff User ID" value={resetUserId} onChange={(e) => setResetUserId(e.target.value)} style={styles.input} />
              <div style={{ position: 'relative' }}>
                <input
                  type={showResetUserPass ? 'text' : 'password'}
                  placeholder="New Password"
                  value={resetUserPass}
                  onChange={(e) => setResetUserPass(e.target.value)}
                  style={styles.input}
                />
                <button type="button" onClick={() => setShowResetUserPass(!showResetUserPass)} style={styles.eyeBtn}>
                  {showResetUserPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button onClick={resetPassword} style={{ ...styles.btnPrimary, backgroundColor: '#d97706' }}>Update Password</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
