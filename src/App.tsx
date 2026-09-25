import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { initializeApp } from 'Bhai, zabardast! Chal ab isko step-by-step solid banate hain. 

Aapki dono requirements maine bilkul exact implement kar di hain:
1. **Create Employee Form Ka Order:**
   * 1. **Department**
   * 2. **Employee ID**
   * 3. **Employee Name**
   * 4. **Login Password**
   * *(Save karte hi employee ka QR code banega aur sath hi uska Login User bhi ban jayega).*
2. **HR Panel Mein Naya Feature:** "Remove Employee" ke theek niche **"Reset Employee Password"** ka button jud gaya hai, jahan se HR kisi bhi employee ka naya password set kar sakta hai.
3. **Employee Login:** Employee main screen se apni ID aur Password daal kar login karega. Login hote hi usko **uska apna Digitalfirebase/app';
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
  KeyRound,
  User as UserIcon,
} from 'lucide-react';

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: 'AIzaSyB0CSGyhhMSWq4JGbm80UcQjkgoBsdF4js',
  authDomain: 'unicharm-attendence.firebaseapp.com',
  projectId: 'unicharm-attendence',
  storageBucket QR ID Card** aur **uski apni Attendance History** dikhegi!

---

### Poora Updated `App.tsx` (Copy & Paste Kar Lo):

```tsx
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
: 'unicharm-attendence.firebasestorage.app',
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
  role: 'admin' | 'hr' | 'guard' | 'employee';
}

export default function App() {
  const [role, setRole] = useState<'login' | 'admin' | 'hr' | 'guard' | 'employee'>('login');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(  where,
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
  KeyRound,
  User as UserIcon,
} from 'lucide-react';

// FIREBASE CONFIG
const firebaseConfig = {
  apiKey: 'AIzaSyB0CSGyhhMSWq4JGbm80UcQjkgo[]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentEmp, setCurrentEmp] = useState<Employee | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // HR & Guard pages
  const [hrPage, setHrPage] = useState<'home' | 'createEmp' | 'removeEmp' | 'resetEmpPass' | 'reprintEmp' | 'headcount'>('home');
  const [guardPage, setGuardPage] = useState<'home' | 'in' | 'out' | 'attendance' | 'headcount'>('home');
  const [guardSubPage, setGuardSubPage] = useState<'' | 'in-qr' | 'in-manual' | 'out-qr' | 'out-manual'>('');

  // Password visibility states
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showNewUserPass, setShowNewUserPass] = useState(false);
  const [showResetUserPass, setShowResetUserPass] = useState(false);
  const [showEmpNewPass, setShowEmpNewPass] = useState(false);
  const [showHrResetEmpPass, setShowHrResetEmpPass] = useState(false);

  // Form states
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserPass, setResetUserPass] = useState('');

  // Form: Department first, then Emp ID, then Name, then Password
  const [newEmp, setNewEmp] = useState({ dept: '', empId: '', name: '', password: '' });
  const [removeEmpId, setRemoveEmpId] = useState('');
  const [reprintEmpId, setReprintEmpId] = useState('');
  const [hrResetEmpId, setHrResetEmpId] = useState('');
  const [hrResetEmpPass, setHrResetEmpPass] = useState('');

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

  // LOGIN HANDLER (ADMIN, HR, GUARD & EMPLOYEE)
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = loginId.trim();
    const cleanPass = loginPass.trim();

    if (!cleanId || !cleanPass) {
      return alert('User ID aur Password dono bharna zaroori hai');
    }

    setLoading(true);
    try {
      const userSnap = await getDocs(collection(db, 'users'));
      const allUsers = userSnap.docs.map((d) => d.data() as User);

      // Case-insensitive ID check (EMP101 == emp101)
      const matchedUser = allUsers.find(
        (u) => u.id.toLowerCase() === cleanId.toLowerCase() && u.password === cleanPass
      );

      if (matchedUser) {
        setRole(matchedUser.role);

        if (matchedUser.role === 'guard') setGuardPage('home');
        if (matchedUser.role === 'hr') setHrPage('home');
        if (matchedUser.role === 'employee') {
          // Employee data load
          const foundEmp = employees.find((e) => e.empId.toLowerCase() === cleanId.toLowerCase());
          if (foundEmp) {
            setCurrentEmp(foundEmp);
          } else {
            const empDoc = await getDoc(doc(db, 'employee', cleanId));
            if (empDoc.exists()) setCurrentEmp(empDoc.data() as Employee);
          }
        }
        setLoginId('');
        setLoginPass('');
      } else {
        alert('Galat User ID ya Password!');
      }
    } catch (err) {
      console.error(err);
      alert('Login error. Rules check karein.');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (roleToCreate: 'guard' | 'hr') => {
    const cleanUid = newUserId.trim();
    const cleanPass = newUserPass.trim();
    if (!cleanUid || !cleanPass) return alert('Fill ID and Password');

    const currentHRCount = users.filter((u) => u.role === 'hr').length;
    const currentGuardCount = users.filter((u) => u.role === 'guard').length;

    if (roleToCreate === 'hr' && currentHRCount >= MAX_HR_BsdF4js',
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
  role: 'admin' | 'hr' | 'guard' | 'employee';
}

export default function App() {
  const [role, setRole] = useState<'login' | 'admin' | 'hr' | 'guard' | 'employee'>('login');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentEmp, setCurrentEmp] = useState<Employee | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // HR & Guard pages
  const [hrPage, setHrPage] = useState<'home' | 'createEmp' | 'removeEmp' | 'resetEmpPass' | 'reprintEmp' | 'headcount'>('home');
  const [guardPage, setGuardPage] = useState<'home' | 'in' | 'out' | 'attendance' | 'headcount'>('home');
  const [guardSubPage, setGuardSubPage] = useState<'' | 'in-qr' | 'in-manual' | 'out-qr' | 'out-manual'>('');

  // Password visibility states
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showNewUserPass, setShowNewUserPass] = useState(false);
  const [showResetUserPass, setShowResetUserPass] = useState(false);
  const [showEmpPass, setShowEmpPass] = useState(false);
  const [showHrResetEmpPass, setShowHrResetEmpPass] = useState(false);

  // Form states
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserPass, setResetUserPass] = useState('');

  // HR Form states (Department -> EmpID -> Name -> Password)
  const [newEmp, setNewEmp] = useState({ dept: '', empId: '', name: '', password: '' });
  const [removeEmpId, setRemoveEmpId] = useState('');
  const [reprintEmpId, setReprintEmpId] = useState('');
  const [hrResetEmpId, setHrResetEmpId] = useState('');
  const [hrResetEmpPass, setHrResetEmpPass] = useState('');

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

  // LOGIN (Admin, HR, Guard, Employee)
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = loginId.trim();
    const cleanPass = loginPass.trim();

    if (!cleanId || !cleanPass) return alert('User ID aur Password dono dalein');

    setLoading(true);
    try {
      const userSnap = await getDocs(collection(db, 'users'));
      const allUsers = userSnap.docs.map((d) => d.data() as User);

      // Match Case-Insensitively for convenience
      const foundUser = allUsers.find(
        (u) => u.id.toLowerCase() === cleanId.toLowerCase() && u.password === cleanPass
      );

      if (foundUser) {
        setRole(foundUser.role);
        if (foundUser.role === 'guard') setGuardPage('home');
        if (foundUserUSERS) {
      return alert(`LIMIT EXCEEDED: Aap maximum ${MAX_HR_USERS} HR users hi bana sakte hain.`);
    }

    if (roleToCreate === 'guard' && currentGuardCount >= MAX_GUARD.role === 'hr') setHrPage('home');
        if (foundUser.role === 'employee') {
          const empDetails = employees.find((e) => e.empId.toLowerCase() === foundUser.id.toLowerCase());
          setCurrentEmp(empDetails || { empId: foundUser.id, name: 'Employee', dept: '-', qrData: foundUser.id });
        }
        setLoginId('');
        setLoginPass('');
      } else {
        alert('Wrong User ID or Password!');
      }
    } catch (err) {
      console.error(err);
      alert('Login Error. Check Firebase connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (roleToCreate: 'guard' | 'hr') => {
    const cleanUid = newUserId.trim();
    const cleanPass = newUserPass.trim();
    if (!cleanUid || !cleanPass) return alert('Fill ID and Password');

    const currentHRCount = users.filter((u) => u.role === 'hr').length;
    const currentGuardCount = users.filter((u) => u.role === 'guard').length;

    if (roleToCreate ===_USERS) {
      return alert(`LIMIT EXCEEDED: Aap maximum ${MAX_GUARD_USERS} Security users hi bana sakte hain.`);
    }

    if (users.find((u) => u.id.toLowerCase() === cleanUid.toLowerCase())) {
      return alert('User ID already exists');
    }

    const newUser: User = {
      id: cleanUid,
      password: cleanPass,
      role: roleToCreate,
    };
    await setDoc(doc(db, 'users', cleanUid), newUser);
    setUsers([...users, newUser]);
    alert(`${roleToCreate.toUpperCase()} user created successfully`);
    setNewUserId('');
    setNewUserPass('');
  };

  const resetPassword = async () => {
    const cleanUid = resetUserId.trim();
    const cleanPass = resetUserPass.trim();
    if (!cleanUid || !cleanPass) return alert('Fill ID and Password');
    const userFound = users.find((u) => u.id.toLowerCase() === 'hr' && currentHRCount >= MAX_HR_USERS) {
      return alert(`LIMIT EXCEEDED: Aap maximum ${MAX_HR_USERS} HR users hi bana sakte hain.`);
    }

    if (roleToCreate === 'guard' && currentGuardCount >= MAX_GUARD_USERS) {
      return alert(`LIMIT EXCEEDED: Aap maximum ${MAX_GUARD_USERS} Security users hi bana sakte hain.`);
    }

    if (users.find((u) => u.id.toLowerCase() === cleanUid.toLowerCase())) {
      return alert('User ID already exists');
    }

    const newUser: User = {
      id: cleanUid,
      password: cleanPass,
      role: roleToCreate,
    };
    await setDoc(doc(db, 'users', cleanUid), newUser);
    setUsers([...users, newUser]);
    alert(`${roleToCreate.toUpperCase()} user created successfully`);
    setNewUserId('');
    setNewUserPass('');
  };

  const resetPassword = async () => {
    const cleanUid = resetUserId.trim();
    const cleanPass = resetUserPass.trim();
    if (!cleanUid || !cleanPass) return alert('Fill ID and Password');

    const existing = users.find((u) => u.id.toLowerCase() === cleanUid.toLowerCase());
    if (!existing) return alert('User ID does not exist');

    await updateDoc(doc(db, 'users', existing.id), { password: cleanPass });
    setUsers(users.map((u) => (u.id === existing.id ? { ...u, password: cleanPass } : u)));
    alert(' cleanUid.toLowerCase());
    if (!userFound) return alert('User ID does not exist');

    await updateDoc(doc(db, 'users', userFound.id), { password: cleanPass });
    setUsers(users.map((u) => (u.id === userFound.id ? { ...u, password: cleanPass } : u)));
    alert('Password reset successful');
    setResetUserId('');
    setResetUserPass('');
  };

  // HR CREATES EMPLOYEE + CREATES USER LOGIN
  const saveEmployee = async () => {
    const cleanDept = newEmp.dept.trim();
    const cleanEmpId = newEmp.empId.trim();
    const cleanName = newEmp.name.trim();
    const cleanPass = newEmp.password.trim();

    if (!cleanDept || !cleanEmpId || !cleanName || !cleanPass) {
      return alert('Department, Employee ID, Name aur Password sabhi zaroori hain!');
    }

    if (employees.length >= MAX_EMPLOYEES) {
      return alert(`LIMIT EXCEEDED: Maximum ${MAX_EMPLOYEES} employees limit reached.`);
    }

    if (employees.find((e) => e.empId.toLowerCase() === cleanEmpId.toLowerCase())) {
      return alert('Employee ID already exists');
    }

    setLoading(true);
    try {
      const empData: Employee = {
        dept: cleanDept,
        empId: cleanEmpId,
        name: cleanName,
        qrData: JSON.stringify({ empId: cleanEmpId, name: cleanName }),
      };

      // 1. Save in Employee Collection
Password reset successful');
    setResetUserId('');
    setResetUserPass('');
  };

  // HR CREATES EMPLOYEE (Dept -> EmpID -> Name -> Password)
  const saveEmployee = async () => {
    const cleanDept = newEmp.dept.trim();
    const cleanEmpId = newEmp.empId.trim();
    const cleanName = newEmp.name.trim();
    const cleanPass = newEmp.password.trim();

    if (!cleanDept || !cleanEmpId || !cleanName || !cleanPass) {
      return alert('Sabhi fields bharna zaroori hai! (Department, Emp ID, Name, Password)');
    }

    if (employees.length >= MAX_EMPLOYEES) {
      return alert(`LIMIT EXCEEDED: Maximum ${MAX_EMPLOYEES} employees limit reached.`);
    }

    if (employees.find((e) => e.empId.toLowerCase() === cleanEmpId.toLowerCase())) {
      return alert('Yeh Employee ID pehle se system mein hai!');
    }

    setLoading(true);
    try {
      const empData: Employee = {
        dept: cleanDept,
        empId: cleanEmpId,
        name: cleanName,
        qrData: JSON.stringify({ empId: cleanEmpId, name: cleanName }),
      };

      // 1. Save in Employee Collection
      await setDoc(doc(db, 'employee', cleanEmpId), empData);

      // 2. Create User login for Employee
      const empUser: User = {
        id: cleanEmpId,
        password: cleanPass,
        role: 'employee',
      };
      await setDoc(doc(db, 'users', cleanEmpId), empUser);

      setEmployees([...employees, empData]);
      setUsers([...users, empUser]);
      setGeneratedQR(empData);
      setNewEmp({ dept: '', empId      await setDoc(doc(db, 'employee', cleanEmpId), empData);

      // 2. Save in Users Collection for Login
      const empUser: User = {
        id: cleanEmpId,
        password: cleanPass,
        role: 'employee',
      };
      await setDoc(doc(db, 'users', cleanEmpId), empUser);

      setEmployees([...employees, empData]);
      setUsers([...users, empUser]);
      setGeneratedQR(empData);
      setNewEmp({ dept: '', empId: '', name: '', password: '' });
      alert(`Employee ban gaya! Employee ID '${cleanEmpId}' se login kar sakta hai.`);
    } catch (err) {
      console.error(err);
      alert('Error creating employee.');
    } finally {
      setLoading(false);
    }
  };

  // HR RESETS EMPLOYEE PASSWORD
  const handleHrResetEmpPass = async () => {
    const cleanEmpId = hrResetEmpId.trim();
    const cleanNewPass = hrResetEmpPass.trim();

    if (!cleanEmpId || !cleanNewPass) {
      return alert('Employee ID aur Naya Password dono bharein');
    }

    const empExists = employees.find((e) => e.empId.toLowerCase() === cleanEmpId.toLowerCase());
    if (!empExists) {
      return alert('Employee ID system mein nahi mili');
    }

    setLoading(true);
    try {
      await setDoc(
        doc(db, 'users', empExists.empId),
        {
          id: empExists.empId,
          password: cleanNewPass,
          role: 'employee',
        },
        { merge: true }
      );

      setUsers((prev) =>: '', name: '', password: '' });
      alert(`Employee ban gaya!\nLogin ID: ${cleanEmpId}\nPassword: ${cleanPass}`);
    } catch (err) {
      console.error(err);
      alert('Employee save karne mein error aayi.');
    } finally {
      setLoading(false);
    }
  };

  // HR RESETS EMPLOYEE PASSWORD
  const handleHrResetEmpPassword = async () => {
    const cleanId = hrResetEmpId.trim();
    const cleanPass = hrResetEmpPass.trim();

    if (!cleanId || !cleanPass) return alert('Employee ID aur Naya Password dono dalein');

    const empExists = employees.find((e) => e.empId.toLowerCase() === cleanId.toLowerCase());
    if (!empExists) return alert('Employee ID record mein nahi mili!');

    setLoading(true);
    try {
      // Update in users collection
      await setDoc(doc(db, 'users', empExists.empId), {
        id: empExists.empId,
        password: cleanPass,
        role: 'employee',
      }, { merge: true });

      setUsers((prev) => {
        const filtered = prev.filter((u) => u.id.toLowerCase() !== empExists.empId.toLowerCase());
        return [...filtered, { id: empExists.empId, password: cleanPass, role: 'employee' }];
      });

      alert(`Success! Employee (${empExists.name} - ${empExists.empId}) ka password reset ho gaya: ${cleanPass}`);
      setHrResetEmpId('');
      setHrResetEmpPass('');
      setHrPage('home');
    } catch (err) {
      console.error(err);
      alert('Password reset karne mein error aayi.');
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async () => {
    if (!removeEmpId) return alert('Please enter Employee ID');
    const cleanId = removeEmpId.trim();
    const empExists = employees.find((e) => e.empId.toLowerCase() === cleanId.toLowerCase());
    if (!empExists) return alert('Employee ID not found');

    if (!window.confirm(`Are you sure you want to remove ${empExists.name} (${empExists.empId})?`)) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'employee', empExists.empId));
      await deleteDoc(doc(db, 'users', empExists.empId));
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

  // DOWNLOAD STICKER (8cm x 6cm)
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
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(COMPANY_NAME.toUpperCase(), width / 2, 80);

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('GATEPASS STICKER', width / 2, 115);

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
    ctx.fillText('Unicharm Security Approved', width / 2, 740);

    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = `Sticker_8x6cm_${emp.empId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const markAttendance = async (empId: string, type: 'IN' | 'OUT') => {
    const cleanEmpId = empId.trim();
    if (!cleanEmpId) return alert('Please enter or scan an Employee ID');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const empExists = employees.find((e) => e.empId.toLowerCase() === cleanEmpId.toLowerCase());
    if (!empExists) {
      alert('Employee ID not found in system');
      return false;
    }

    const currentAttendance = attendanceRef.current;

    if (type === 'OUT') {
      const todayRecords = currentAttendance.filter(
        (a) => a.empId === empExists.empId && a.date === dateStr
      );
      const lastRecord = todayRecords[todayRecords.length - 1];
      if (!lastRecord || lastRecord.type !== 'IN') {
        setScanResult({ empId: 'Error', type: 'FIRST IN REQUIRED' });
        setShowPopup(true);
        return false;
      }
    }

    const newRecord: AttendanceRecord = {
      empId: empExists.empId,
      date: dateStr,
      time: timeStr,
      type,
    };
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
      const row [
        ...prev.filter((u) => u.id !== empExists.empId),
        { id: empExists.empId, password: cleanNewPass, role: 'employee' },
      ]);

      alert(`Success! Employee (${empExists.name}) ka password reset ho gaya.\nNaya Password: ${cleanNewPass}`);
      setHrResetEmpId('');
      setHrResetEmpPass('');
      setHrPage('home');
    } catch (err) {
      console.error(err);
      alert('Password reset karne mein error aayi.');
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async () => {
    if (!removeEmpId) return alert('Please enter Employee ID');
    const cleanId = removeEmpId.trim();
    const empExists = employees.find((e) => e.empId.toLowerCase() === cleanId.toLowerCase());
    if (!empExists) return alert('Employee ID not found');

    if (!window.confirm(`Are you sure you want to remove ${empExists.name} (${empExists.empId})?`)) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'employee', empExists.empId));
      await deleteDoc(doc(db, 'users', empExists.empId));
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

  // DOWNLOAD STICKER IN EXACT 8cm x 6cm STICKER RATIO
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
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText(COMPANY_NAME.toUpperCase(), width / 2, 80);

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('GATEPASS STICKER', width / 2, 115);

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
    ctx.fillText('Unicharm Security Approved', width / 2, 740);

    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = `Sticker_8x6cm_${emp.empId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const markAttendance = async (empId: string, type: 'IN' | 'OUT') => {
    if (!empId) return alert('Please enter or scan an Employee ID');
    const cleanId = empId.trim();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const empExists = employees.find((e) => e.empId.toLowerCase() === cleanId.toLowerCase());
    if (!empExists) {
      alert('Employee ID not found in system');
      return false;
    }

    const currentAttendance = attendanceRef.current;

    if (type === 'OUT') {
      const todayRecords = currentAttendance.filter(
        (a) => a.empId === empExists.empId && a.date === dateStr
      );
      const lastRecord = todayRecords[todayRecords.length - 1];
      if (!lastRecord || lastRecord.type !== 'IN') {
        setScanResult({ empId: 'Error', type: 'FIRST IN REQUIRED' });
        setShowPopup(true);
        return false;
      }
    }

    const newRecord: AttendanceRecord = {
      empId: empExists.empId,
      date: dateStr,
      time: timeStr,
      type,
    };
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
    for (let day =  = [index + 1, emp.empId, emp.name, emp.dept];
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
            row.push(`🟢 IN:${inRec.time} OUT:${outRec.time} (${durationFormatted})1; day <= daysInMonth; day++) colWidths.push({ wch: 28 });
 [8h+ OK]`);
          } else {
            absentDaysCount++;
            row.push(`🟡 IN:${inRec.time} OUT:${outRec.time} (${durationFormatted}) [<8h Short]`);
          }
        } else if (inRec) {
          absentDaysCount++;
          row.    colWidths.push({ wch: 16 }, { wch: 16 }, { wch: 20 });
    ws['!cols'] = colWidths;

    const wb = XLSXpush(`🔴 IN:${inRec.time} (No OUT)`);
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
    alert('Master Sheet Downloaded Successfully! (Only 8h+ duty with OUT are counted as Present)');
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
      maxWidth: '420px',
      width: '100%',
      borderRadius: '24px',
      padding: '24px 20px',
      textAlign: 'left',
      boxSizing: 'border-box',
    },
    glassInputContainer: {
      position: 'relative',
      width: '100%',
      margin: '4px 0 14px 0',
    },
    glassInput: {
      width: '100%',
      padding: '12px 14px',
      display: 'block',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      border: '2px solid #cbd5e1',
      borderRadius: '12px',
      fontSize: '14px',
      color: '#000',
      fontWeight: '800',
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
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
      margin: '8.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Register');
    XLSX.writeFile(wb, `${COMPANY_NAME}_Attendance_${monthName}.xlsx`);
    alert('Master Sheet Downloaded Successfully!');
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
      maxWidth: '420px',
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'centerpx 0 0 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
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
    backgroundImage: role === 'login' ? "',
      gap: '8px',
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
    url('/bg.jpg')" : '#f8fafc',
    backgroundColor: role === 'login' ? '...styles.container,
    backgroundImage: role === 'login' ? "url('/bg.jpg')" : '#f8fafc',transparent' : '#f8fafc',
  };
  const dynamicCardStyle: React.CSSProperties = {
    ...styles.glassCard,
    backgroundColor: role === 'login' ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
    border:
      role === 'login'
        ? '2px solid rgba(255, 255, 255, 0.2)'
        : '1px solid #cbd5e
    backgroundColor: role === 'login' ? 'transparent' : '#f8fafc',
  };
  const dynamicCardStyle: React.CSSProperties = {
    ...styles.glassCard,
    backgroundColor: role === 'login' ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
    border:
      role === 'login'
        ? '2px solid rgba(255, 255, 255, 0.2)'1',
  };

  const hrCount = users.filter((u) => u.role === 'hr').length;
  const guardCount = users.filter((u) => u.role === 'guard').length;

  return (
    <div style={dynamicContainerStyle}>
      {/* PERFECT PRINT STYLING FOR 8cm x 6cm STICKER PAPER */}
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
            display: flex !important
        : '1px solid #cbd5e1',
  };

  const hrCount = users.filter((u) => u.role === 'hr').length;
  const guardCount = users.filter((u) => u.role === 'guard').length;

  return (
    <div style={dynamicContainerStyle}>
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
            border: 2px solid;
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
                ? '#dc #000 !important;
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
        <div style={styles.2626'
                : '#d97706'
            }
            size={4toast}>
          <CheckCircle2
            color={
              scanResult.type === 'IN'
                ? '#05968}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#000' }}>
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

        {/* 1. LOGIN SCREEN (Admin, HR, Guard, Employee) */}
        {role === 'login' && (
          <div style={dynamicCardStyle}>
            <form onSubmit={handleLogin}>
              <div style={styles.glassInputContainer}>
                <input
                  type="text"
                  placeholder="User ID / Employee ID"
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
                  style={{ ...styles.glassInput, paddingRight: '40px' }}
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

        {/* 2. EMPLOYEE SELF-SERVICE PORTAL */}
        {role === 'employee' && currentEmp && (
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
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#000' }}>
                  {currentEmp.name}
                </h2>
                <div style={{ fontSize: '12px', color: '#475569', fontWeight: 'bold' }}>
                  ID: {currentEmp.empId} | Dept: {currentEmp.dept}
                </div>
              </div>
              <button
                onClick={() => setRole('login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
              >
                <LogOut size={22} />
              </button>
            </div>

            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              {/* Employee's Digital Gatepass QR */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '2px solid #000',
                  margin: '0 auto 16px auto',
                  width: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>
                  {COMPANY_NAME} GATEPASS
                </div>
                <div style={{ margin: '8px 0' }}>
                  <QRCodeCanvas value={currentEmp.qrData} size={110} />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#059669' }}>
                  Scan at Security Gate
                </div>
              </div>

              {/* Attendance Log for this Employee */}
              <h3 style={{ fontSize: '14px', fontWeight: '900', textAlign: 'left', marginBottom: '8px' }}>
                My Recent Punches
              </h3>
              <div style={{ maxHeight: '180px', overflowY: 'auto', textAlign: 'left' }}>
                {attendance.filter((a) => a.empId === currentEmp.empId).length === 0 ? (
                  <div style={{ padding: '10px', color: '#64748b', fontSize: '12px' }}>
                    No punches recorded yet.
                  </div>
                ) : (
                  attendance
                    .filter((a) => a.empId === currentEmp.empId)
                    .reverse()
                    .slice(0, 10)
                    .map((rec, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '8px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          margin: '4px 0',
                          backgroundColor: rec.type === 'IN' ? '#ecfdf5' : '#fef2f2',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                          fontWeight: '800',
                        }}
                      >
                        <div>{rec.date} - {rec.time}</div>
                        <div style={{ color: rec.type === 'IN' ? '#059669' : '#dc2669'
                : scanResult.type === 'OUT'
                ? '#dc2626'
                : '#d97706'
            }
            size={48}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#000' }}>
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

        {/* 1. LOGIN SCREEN */}
        {role === 'login' && (
          <div style={dynamicCardStyle}>
            <form onSubmit={handleLogin}>
              <div style={styles.glassInputContainer}>
                <input
                  type="text"
                  placeholder="User ID / Employee ID"
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

        {/* 2. EMPLOYEE PERSONAL PORTAL */}
        {role === 'employee' && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserIcon color="#2563eb" size={24} />
                <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>
                  Employee Portal
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

            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#000' }}>
                {currentEmp?.name || 'Employee'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>
                ID: {currentEmp?.empId} | Dept: {currentEmp?.dept}
              </div>

              {/* Digital Badge QR */}
              {currentEmp && (
                <div style={{ margin: '20px auto 10px auto', display: 'inline-block', padding: '12px', border: '2px solid #000', borderRadius: '16px', background: '#fff' }}>
                  <QRCodeCanvas value={currentEmp.qrData} size={150} />
                  <div style={{ fontSize: '11px', fontWeight: '800', marginTop: '6px' }}>GATE PASS QR</div>
                </div>
              )}

              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
                Gate par Entry & Exit ke liye yeh QR guard ko scan karwayein.
              </div>
            </div>
          </div>
        )}

        {/* 3. ADMIN SCREEN */}
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
              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#000' }}>
                Admin Panel
              </h2>
              <button
                onClick={() => setRole('login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
              >
                <LogOut size={22} />
              </button>
            </div>
            <div style={{ padding: '20px 0', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1426' }}>
                          PUNCH {rec.type}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. ADMIN SCREEN */}
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
              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#000' }}>
                Admin Panel
              </h2>
              <button
                onClick={() => setRole('login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
              >
                <LogOut size={22} />
              </button>
            </div>
            <div style={{ padding: '20px 0', textAlign: 'left' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '8px', color: '#000' }}>
                Create Staff User
              </h3>

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
              px', fontWeight: '900', marginBottom: '8px', color: '#000' }}>
                Create User
              </h3>
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
              <div style={{ display: '<div style={styles.glassInputContainer}>
                <input
                  type={showNewUserPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  style={{ ...styles.glassInput, paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewUserPass(!showNewUserPass)}
                  style={styles.eyeBtn}
                >
                  {showNewUserPass ? <EyeOff sizeflex', gap: '10px' }}>
                <button onClick={() => createUser('hr')} style={{ ...styles.btnPrimary, width: '48%' }}>
                  HR ({hrCount}/{MAX_HR_USERS})
                </button>
                <button onClick={() => createUser('guard')} style={{ ...styles.btnSuccess, width: '48%' }}>
                  Security ({guardCount}/{MAX_GUARD_USERS})
                </button>
              </div>

              <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '24px 0' }} />
              <h3 style={{ fontSize: '14px', fontWeight:={18} /> : <Eye size={18} />}
                </button>
              </div>
               '900', marginBottom: '8px', color: '#000' }}>
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

        {/* 4. HR SCREEN */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users color="#2563eb" size={24} />
                    <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#000' }}>
                      HR Management
                    </h2>
                  </div>
                  <button
                    onClick={() => setRole('login')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                  >
                    <LogOut size={22} />
                  </button>
                </div>

                <div style={{ padding: '20px 0' }}>
                  {hrPage === 'home' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button onClick={() => setHrPage('createEmp')} style={styles.btnSecondary}>
                        <UserPlus size={18} /> Create Employee ({employees.length}/{MAX_EMPLOYEES})
                      </button>

                      <button onClick={() => setHrPage('removeEmp')} style={styles.btnSecondary}>
                        <UserMinus size={18} /> Remove Employee
                      </button>

                      {/* NEW: RESET EMPLOYEE PASSWORD */}
                      <button
                        onClick={() => setHrPage('resetEmpPass')}
                        style={{ ...styles.btnSecondary, backgroundColor: '#fffbeb', borderColor: '#d97706', color: '#b45309' }}
                      >
                        <KeyRound size={18} /> Reset Employee Password
                      </button>

                      <button onClick={() => setHrPage('reprintEmp')} style={styles.btnSecondary}>
                        <QrCode size={18} /> Reprint QR Card
                      </button>

                      <button onClick={exportAttendance} style={styles.btnSecondary}>
                        <FileSpreadsheet size={18} /> Master Attendance
                      </button>

                      <button onClick={() => setHrPage('headcount')} style={styles.btnSecondary}>
                        <UserCheck size={18} /> Head Count
                      </button>
                    </div>
                  )}

                  {/* FORM: DEPARTMENT FIRST -> EMP ID -> NAME -> PASSWORD */}
                  {hrPage === 'createEmp' && (
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>
                        Total Employees Added: {employees.length} / {MAX_EMPLOYEES}
                      </div>

                      {/* 1. Department */}
                      <label style={{ fontSize: '12px', fontWeight: '900' }}>1. Department</label>
                      <input
                        placeholder="Department (e.g. Production, Sales)"
                        value={newEmp.dept}
                        onChange={(e) => setNewEmp({ ...newEmp, dept: e.target.value })}
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 12px 0' }}
                      />

                      {/* 2. Employee ID */}
                      <label style={{ fontSize: '12px', fontWeight: '900' }}>2. Employee ID</label>
                      <input
                        placeholder="Employee ID (e.g. EMP101)"
                        value={newEmp.empId}
                        onChange={(e) => setNewEmp({ ...newEmp, empId: e.target.value })}
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 12px 0' }}
                      />

                      {/* 3. Employee Name */}
                      <label style={{ fontSize: '12px', fontWeight: '900' }}>3. Employee Name</label>
                      <input
                        placeholder="Full Name"
                        value={newEmp.name}
                        onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 12px 0' }}
                      />

                      {/* 4. Password */}
                      <label style={{ fontSize: '12px', fontWeight: '900' }}>4. Login Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showEmpNewPass ? 'text' : 'password'}
                          placeholder="Set Password for Employee Login"
                          value={newEmp.password}
                          onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                          style={{ ...styles.glassInput, margin: '4px 0 16px 0' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmpNewPass(!showEmpNewPass)}
                          style={styles.eyeBtn}
                        >
                          {showEmpNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      <button onClick={saveEmployee} style={styles.btnSuccess}>
                        Generate Employee & QR
                      </button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
                        Back
                      </button>
                    </div>
                  )}

                  {/* REMOVE EMPLOYEE */}
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
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
                        Back
                      </button>
                    </div>
                  )}

                  {/* RESET EMPLOYEE PASSWORD SCREEN */}
                  {hrPage === 'resetEmpPass' && (
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#b45309', marginBottom: '6px' }}>
                        Reset Employee Password
                      </h3>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                        Employee ka<div style={{ display: 'flex', gap: '10px' }}>
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

              <hr style={{ border: 'none', borderTop: '2px solid #000', margin: '24px 0' }} />

              <h3 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '8px', color: '#000' }}>
                Reset Staff Password
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
                  style={{ ...styles.glassInput, paddingRight: '40px' }}
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

        {/* 4. HR MANAGEMENT SCREEN */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users color="#2563eb" size={24} />
                    <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#000' }}>
                      HR Management
                    </h2>
                  </div>
                  <button
                    onClick={() => setRole('login')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                  >
                    <LogOut size={22} />
                  </button>
                </div>

                <div style={{ padding: '20px 0' }}>
                  {hrPage === 'home' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button onClick={() => setHrPage('createEmp')} style={styles.btnSecondary}>
                        <UserPlus size={18} /> Create Employee ({employees.length}/{MAX_EMPLOYEES})
                      </button>

                      <button onClick={() => setHrPage('removeEmp')} style={styles.btnSecondary}>
                        <UserMinus size={18} /> Remove Employee
                      </button>

                      {/* NEW: RESET EMPLOYEE PASSWORD BUTTON (Right below Remove Employee) */}
                      <button
                        onClick={() => setHrPage('resetEmpPass')}
                        style={{ ...styles.btnSecondary, backgroundColor: '#fffbeb', borderColor: '#d97706' }}
                      >
                        <KeyRound size={18} color="#d97706" /> Reset Employee Password
                      </button>

                      <button
                        onClick={() => setHrPage('reprintEmp')}
                        style={{ ...styles.btnSecondary, backgroundColor: '#f8fafc' }}
                      >
                        <QrCode size={18} /> Reprint QR Card
                      </button>

                      <button onClick={exportAttendance} style={styles.btnSecondary}>
                        <FileSpreadsheet size={18} /> Master Attendance
                      </button>

                      <button onClick={() => setHrPage('headcount')} style={styles.btnSecondary}>
                        <UserCheck size={18} /> Head Count
                      </button>
                    </div>
                  )}

                  {/* FORM ORDER: Department -> Employee ID -> Employee Name -> Password */}
                  {hrPage === 'createEmp' && (
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>
                        Total Employees Added: {employees.length} / {MAX_EMPLOYEES}
                      </div>

                      {/* 1. Department */}
                      <label style={{ fontSize: '12px', fontWeight: '800' }}>1. Department</label>
                      <input
                        placeholder="e.g. Production, Accounts, HR"
                        value={newEmp.dept}
                        onChange={(e) => setNewEmp({ ...newEmp, dept: e.target.value })}
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 12px 0' }}
                      />

                      {/* 2. Employee ID */}
                      <label style={{ fontSize: '12px', fontWeight: '800' }}>2. Employee ID</label>
                      <input
                        placeholder="e.g. EMP101"
                        value={newEmp.empId}
                        onChange={(e) => setNewEmp({ ...newEmp, empId: e.target.value })}
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 12px 0' }}
                      />

                      {/* 3. Employee Name */}
                      <label style={{ fontSize: '12px', fontWeight: '800' }}>3. Employee Name</label>
                      <input
                        placeholder="e.g. Ramesh Kumar"
                        value={newEmp.name}
                        onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 12px 0' }}
                      />

                      {/* 4. Login Password */}
                      <label style={{ fontSize: '12px', fontWeight: '800' }}>4. Login Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showEmpPass ? 'text' : 'password'}
                          placeholder="e.g. 123456"
                          value={newEmp.password}
                          onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
                          style={{ ...styles.glassInput, paddingRight: '40px', margin: '4px 0 16px 0' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmpPass(!showEmpPass)}
                          style={styles.eyeBtn}
                        >
                          {showEmpPass ? <EyeOff size={18} /> : <Eye size={18} password bhool jane par yahan se naya password set karein.
                      </div>

                      <label style={{ fontSize: '12px', fontWeight: '900' }}>Employee ID</label>
                      <input
                        placeholder="Enter Employee ID (e.g. EMP101)"
                        value={hrResetEmpId}
                        onChange={(e) => setHrResetEmpId(e.target.value)}
                        style={{ ...styles.glassInput />}
                        </button>
                      </div>

                      <button onClick={saveEmployee} style={styles.btnSuccess}>
                        Generate Employee & Gatepass
                      </button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
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
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
                        Back
                      </button>
                    </div>
                  )}

                  {/* RESET EMPLOYEE PASSWORD SCREEN */}
                  {hrPage === 'reset, paddingRight: '14px', margin: '4px 0 12px 0' }}
                      />

                      <label style={{ fontSize: '12px', fontWeight: '900' }}>Naya Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          EmpPass' && (
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#d97706', marginBottom: '6px' }}>
                        Reset Employee Password
                      </h3>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                        Gum ho jane par yahan se employee ka naya login password set karein.
                      </div>

                      <label style={{ fontSize: '12px', fontWeight: '800' }}>Employee ID</label>
                      <input
                        placeholder="e.g. EMP101"
                        value={hrResetEmpId}
                        onChange={(e) => setHrResetEmpId(e.target.value)}
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 12px 0' }}
                      />

                      <label style={{ fontSize: '12px', fontWeight: '800' }}>New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showHrResetEmpPass ? 'text' : 'password'}
                          placeholder="Enter new password"
                          value={hrResetEmpPass}
                          onChange={(e) => setHrResetEmpPass(e.target.value)}
                          style={{ ...styles.glassInput, paddingRight: '40px', margin: '4px 0 16px 0' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowHrResetEmpPass(!showHrResetEmpPass)}
                          style={styles.eyeBtn}
                        >
                          {showHrResetEmpPass ? <EyeOff size={type={showHrResetEmpPass ? 'text' : 'password'}
                          placeholder="Enter New Password"
                          value={hrResetEmpPass}
                          onChange={(e) => setHrResetEmpPass(e.target.value)}
                          style={{ ...styles.glassInput, margin: '4px 0 16px 0' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowHrResetEmpPass(!showHrResetEmpPass)}
                          style={styles.eyeBtn}
                        >
                          {showHrResetEmpPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      <button onClick={handleHrResetEmpPass} style={{ ...styles.btnPrimary, backgroundColor: '#d97706' }}>
                        Update Password
                      </button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
                        Back
                      </button>
                    </div>
                  )}

                  {hrPage === 'reprintEmp' && (
                    <div style={{ textAlign: 'left' }}>18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      <button onClick={handleHrResetEmpPassword} style={{ ...styles.btnPrimary, backgroundColor: '#d97706' }}>
                        Update Password
                      </button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
                        Back
                      </button>
                    </div>
                  )}


                      <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#2563eb', marginBottom: '10px' }}>
                        Reprint QR Card
                      </h3>
                      <input
                        placeholder="Enter Employee ID"
                        value={reprintEmpId}
                        onChange={(e) => setReprintEmpId(e.target.value)}
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 16px 0' }}
                      />
                      <button onClick={handleReprintCard} style={styles.btnPrimary}>
                        Search & Print Card
                      </button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
                        Back
                      </button>
                    </div>
                  )}

                  {hrPage === 'headcount' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: '14px', color: '#000', fontWeight: '900' }}>
                        Total Registered Employees
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
              /* CARD PREVIEW AREA - 8CM X 6CM STICKER */
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
                        fontSize: '16px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        color: '#000',
                        lineHeight: '1.1',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {COMPANY_NAME}
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

                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#059669', marginBottom: '10px' }}>
                  Sticker Print Size: 8 cm x 6 cm (Portrait)
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

        {/* 5. SECURITY SCREEN */}
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
              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#000' }}>
                Security Gate
              </h2>
              <button
                onClick={() => setRole('login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
              >
                <LogOut size={22} />
              </button>
            </div>
            <div style={{ padding: '20px 0' }}>
              {guardPage === 'home' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1                  {hrPage === 'reprintEmp' && (
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#2563eb', marginBottom: '10px' }}>
                        Reprint QR Card
                      </h3>
                      <input
                        placeholder="Enter Employee ID"
                        value={reprintEmpId}
                        onChange={(e) => setReprintEmpId(e.target.value)}
                        style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 16px 0' }}
                      />
                      <button onClick={handleReprintCard} style={styles.btnPrimary}>
                        Search & Print Card
                      </button>
                      <button onClick={() => setHrPage('home')} style={styles.btnSecondary}>
                        Back
                      </button>
                    </div>
                  )}

                  {hrPage === 'headcount' && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: '14px', color: '#000', fontWeight: '900' }}>
                        Total Registered Employees
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
              /* CARD PREVIEW AREA - 8CM X 6CM STICKER BOX */
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
                    <div style={{ fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', color: '#000', lineHeight: '1.1' }}>
                      {COMPANY_NAME}
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

                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#059669', marginBottom: '10px' }}>
                  Sticker Print Size: 8 cm x 6 cm (Portrait)
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

        {/* 5. SECURITY GUARD SCREEN */}
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
              <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#000' }}>
                Security Gate
              </h2>
              <button
                onClick={() => setRole('login')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
              >
                <LogOut size={22} />
              </button>
            </div>
            <div style={{ padding: '20px 0' }}>
              {guardPage === 'home' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button onClick={() => { setGuardPage('in'); setGuardSubPage(''); }} style={styles.btnSuccess}>
                      <Scan size={24} /> IN
                    </button>
                    <button onClick={() => { setGuardPage('out'); setGuardSubPage(''); }} style={{ ...styles.btnPrimary, backgroundColor: '#dc2626' }}>
                      <Scan size={24} /> OUT
                    </button>
                  </div>
                  <button onClick={() => setGuardPage('attendance')} style={styles.btnSecondary}>
                    <Clock size={18} /> Attendance Log
                  </button>
                  <button onClick={() => setGuardPage('headcount')} style={styles.btnSecondary}>
                    <Users size={18} /> Headcount
                  </button>
                </div>
              )}

              {guardPage === 'in' && guardSubPage === '' && (
                <div>
                  <button onClick={() => startScanner('IN')} style={styles.btnSuccess}>
                    Scan QR
                  </button>
                  <button onClick={() => setGuardSubPage('in-manual')} style={styles.btnSecondary}>
                    Manual Entry
                  </button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>
                    Backfr 1fr', gap: '12px' }}>
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
                      style={{ ...styles.btnPrimary, backgroundColor: '#dc2626' }}
                    >
                      <Scan size={24} /> OUT
                    </button>
                  </div>
                  <button onClick={() => setGuardPage('attendance')} style={styles.btnSecondary}>
                    <Clock size={18} /> Attendance Log
                  </button>
                  <button onClick={() => setGuardPage('headcount')} style={styles.btnSecondary}>
                    <Users size={18} /> Headcount
                  </button>
                </div>
              )}

              {guardPage === 'in' && guardSubPage === '' && (
                <div>
                  <button onClick={() => startScanner('IN')} style={styles.btnSuccess}>
                    Scan QR
                  </button>
                  <button onClick={() => setGuardSubPage('in-manual')} style={styles.btnSecondary}>
                    Manual Entry
                  </button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>

                  </button>
                </div>
              )}

              {guardPage === 'in' && guardSubPage === 'in-qr' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>Scanning QR (IN)</h3>
                  <div id="reader-in" style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #059669' }}></div>
                  <button onClick={stopScanner} style={styles.btnSecondary}>Close Camera</button>
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
                  <button onClick={() => markAttendance(manualEmpId, 'IN')} style              )}

              {guardPage === 'in' && guardSubPage === 'in-qr' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#059669' }}>
                    Scanning QR (IN)
                  </h3>
                  <div id="reader-in" style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #059669' }}></div>
                  <button onClick={stopScanner} style={styles.btnSecondary}>
                    Close={styles.btnSuccess}>
                    IN
                  </button>
                  <button onClick={() => { setGuardSubPage(''); setGuardPage('in'); }} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'out' && guardSubPage === '' && (
                <div>
                  <button onClick={() => startScanner('OUT')} style={{ ...styles.btnPrimary, backgroundColor: '#dc2626' }}>
                    Scan QR
                  </button>
                  <button onClick={() => setGuardSubPage('out-manual')} style={styles.btnSecondary}>
                    Manual OUT
                  </button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'out' && guardSubPage === 'out-qr' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#dc2626' }}>Scanning QR (OUT)</h3>
                  <div id="reader-out" style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #dc2626' }}></div>
                  <button onClick={stopScanner} style={styles.btnSecondary}>Close Camera</button>
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
                  <button onClick={() => markAttendance(manualEmpId, 'OUT')} style={{ Camera
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
                  <button onClick={() => markAttendance(manualEmpId, 'IN')} style={styles.btnSuccess}>
                    IN
                  </button>
                  <button onClick={() => { setGuardSubPage(''); setGuardPage('in'); }} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'out' && guardSubPage === '' && (
                <div>
                  <button onClick={() => startScanner('OUT')} style={{ ...styles.btnPrimary, backgroundColor: '#dc2626' }}>
                    Scan QR
                  </button>
                  <button onClick={() => setGuardSubPage('out-manual')} style={styles.btnSecondary}>
                    Manual OUT
                  </button>
                  <button onClick={() => setGuardPage('home')} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'out' && guardSubPage === 'out-qr' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#dc2626' }}>
                    Scanning QR (OUT)
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
                    placeholder="Employee ID"
                    value={manualEmpId}
                    onChange={(e) => setManualEmpId(e.target.value)}
                    style={{ ...styles.glassInput, paddingRight: '14px', margin: '4px 0 16px 0' }}
                  />
                  <button onClick={() => markAttendance(manualEmpId, 'OUT')} style={{ ...styles.btnPrimary, backgroundColor: '#dc2626' }}>
                    OUT
                  </button>
                  <button onClick={() => { setGuardSubPage(''); setGuardPage('out'); }} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'attendance' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '12px' }}>
                    Today's Log
                  </h3>
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
                          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                            No records today
                          </div>
                        ) : (
                          currentItems.map((a, i) => {
                            const emp = employees.find((e) => e.empId === a.empId);
                            return (
                              <div
                                key={i}
                                style={{
                                  padding: '10px',
                                  border: '1px solid #000',
                                  margin: '6px 0',
                                  borderRadius: 8,
                                  background: a.type === 'IN' ? '#ecfdf5' : '#fef2f2',
                                }}
                              >
                                <div style={{ fontWeight: '900', fontSize: '14px' }}>
                                  {emp?.name || 'Unknown'} - {a.empId}
                                </div>
                                <div style={{ fontSize: '12px', color: '#555' }}>
                                  Dept: {emp?.dept || '-'} | Time: {a.time}
                                </div>
                                <div
                                  style={{
                                    fontWeight: '900',
                                    color: a.type === 'IN' ? '#059669' : '#dc2626',
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
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              style={{ ...styles.btnSecondary, width: 'auto', padding: '6px 12px' }}
                            >
                              Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{
                                  ...styles.btnSecondary,
                                  width: 'auto',
                                  padding: '6px 12px',
                                  backgroundColor: currentPage === page ? '#2563eb' : '#fff',
                                  color: currentPage === page ? '#fff' : '#000',
                                }}
                              >
                                {page}
                              </button>
                            ))}
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
                  <div style={{ fontSize: '14px', color: '#000', ...styles.btnPrimary, backgroundColor: '#dc2626' }}>
                    OUT
                  </button>
                  <button onClick={() => { setGuardSubPage(''); setGuardPage('out'); }} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'attendance' && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', marginBottom: '12px' }}>Today's Log</h3>
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
                          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No records today</div>
                        ) : (
                          currentItems.map((a, i) => {
                            const emp = employees.find((e) => e.empId === a.empId);
                            return (
                              <div
                                key={i}
                                style={{
                                  padding: '10px',
                                  border: '1px solid #000',
                                  margin: '6px 0',
                                  borderRadius: 8,
                                  background: a.type === 'IN' ? '#ecfdf5' : '#fef2f2',
                                  textAlign: 'left',
                                }}
                              >
                                <div style={{ fontWeight: '900', fontSize: '14px' }}>
                                  {emp?.name || 'Unknown'} - {a.empId}
                                </div>
                                <div style={{ fontSize: '12px', color: '#555' }}>
                                  Dept: {emp?.dept || '-'} | Time: {a.time}
                                </div>
                                <div
                                  style={{
                                    fontWeight: '900',
                                    color: a.type === 'IN' ? '#059669' : '#dc2626',
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

                  <button onClick={() => { setGuardPage('home'); setCurrentPage(1); }} style={styles.btnSecondary}>
                    Back
                  </button>
                </div>
              )}

              {guardPage === 'headcount' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '14px', color: '#000', fontWeight: '900' }}>Employees Currently IN</div>
                  <div style={{ fontSize: '48px', fontWeight: '900', color: '#059669', margin: '10px 0' }}>
                    {getHeadCount()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '16px' }}>
                    Total Staff: {employees.length}
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
