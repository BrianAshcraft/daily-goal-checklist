import React, { useState, useEffect } from 'react';
import { getDocs, query, where } from 'firebase/firestore'; 
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { setDoc, doc, updateDoc } from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
function ProfileScreen({ user, profile }) {
  const [xpEnabled, setXpEnabled] = useState(profile?.xpEnabled ?? true);

const [allUsers, setAllUsers] = useState([]);
const [showUserList, setShowUserList] = useState(false);

const loadAllUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'profiles'));
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setAllUsers(users);
  } catch (err) {
    console.error('Failed to load users:', err);
  }
};



  useEffect(() => {
    setXpEnabled(profile?.xpEnabled ?? true);
  }, [profile]);

  const handleToggle = async () => {
    const newValue = !xpEnabled;
    setXpEnabled(newValue);
    const userRef = doc(db, 'profiles', user.uid);
    try {
      await updateDoc(userRef, { xpEnabled: newValue });
    } catch (err) {
      console.error('Failed to update XP tracking toggle:', err);
    }
  };

  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h2>Profile Page</h2>
      <p><strong>Email:</strong> {user?.email}</p>
      <p><strong>User ID:</strong> {user?.uid}</p>
      <p><strong>Level:</strong> {profile?.level ?? 0}</p>
      <p><strong>XP:</strong> {profile?.xp ?? 0}</p>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
        <input type="checkbox" checked={xpEnabled} onChange={handleToggle} />
        Enable XP Tracking
      </label>

      <p style={{ marginTop: '1rem' }}>
        <strong>Admin:</strong> {profile?.isAdmin ? 'Yes' : 'No'}
      </p>

{profile.isAdmin && (
  <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '2px solid #555' }}>
    <h2>Admin Panel</h2>
<button
  onClick={async () => {
    if (!showUserList) {
      await loadAllUsers();
    }
    setShowUserList(!showUserList);
  }}
  style={{
    padding: '0.5rem 1rem',
    backgroundColor: '#444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    marginBottom: '1rem'
  }}
>
  {showUserList ? 'Hide User List' : 'Load All Users'}
</button>


    {showUserList && (
  <ul>
    {allUsers.map(u => (
      <li key={u.id} style={{ marginBottom: '0.5rem' }}>
        <strong>{u.username}</strong><br />
        Email: {u.email || '(no email saved)'}<br />
        Level: {u.level} | XP: {u.xp}<br />
        Admin: {u.isAdmin ? '✅' : '❌'}
      </li>
    ))}
  </ul>
)}

  </div>
)}


    </div>
  );
}



function AppRouter() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    xp: 0,
    level: 0,
    xpEnabled: true,
    isAdmin: false,
    email: ''
  });

  const auth = getAuth();
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setUser(user);

    if (user) {
      const userRef = doc(db, 'profiles', user.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfile({
          xp: data.xp || 0,
          level: data.level || 0,
          xpEnabled: data.xpEnabled !== false,
          isAdmin: data.isAdmin === true,
          email: data.email || user.email
        });
      } else {
        await setDoc(userRef, {
          xp: 0,
          level: 0,
          xpEnabled: true,
          isAdmin: false,
          email: user.email
        });

        setProfile({
          xp: 0,
          level: 0,
          xpEnabled: true,
          isAdmin: false,
          email: user.email
        });
      }
    }
  });

  return () => unsubscribe();
}, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <MainApp user={user} profile={profile} /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <RegisterScreen /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <ProfileScreen user={user} profile={profile} /> : <Navigate to="/login" />} />

        <Route path="*" element={<div style={{ color: 'white' }}>Page not found</div>} />
      </Routes>
    </Router>
  );
}

function LoginScreen() {
  const auth = getAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#0e0e0e',
      margin: 0,
      padding: 0
    }}>
      <form
        onSubmit={handleLogin}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: 'transparent',
          padding: '2rem',
          textAlign: 'center',
          width: '300px'
        }}
      >
        <h2 style={{ color: 'white', marginBottom: '1rem' }}>Everything Tracker</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid #888',
            backgroundColor: 'transparent',
            color: 'white'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid #888',
            backgroundColor: 'transparent',
            color: 'white'
          }}
        />

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            type="submit"
            style={{
              backgroundColor: '#1a1a1a',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            style={{
              backgroundColor: '#1a1a1a',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
}





function NumericInputCell({ habit, date, xp, onSave }) {
  const initial = habit.values?.[date] || '';
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  const handleSave = async () => {
    if (value === initial) return;
    await onSave(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur(); // Triggers save through onBlur
    }
  };

  return (
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      style={{ width: '4rem' }}
    />
  );
}

function RegisterScreen() {
  const auth = getAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [xpEnabled, setXpEnabled] = useState(true);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'profiles', user.uid), {
        username,
        email,
        xp: 0,
        level: 0,
        xpEnabled,
        isAdmin: false
      });
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#0e0e0e'
    }}>
      <form
        onSubmit={handleRegister}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: 'transparent',
          padding: '2rem',
          textAlign: 'center',
          width: '300px'
        }}
      >
        <h2 style={{ color: 'white', marginBottom: '1rem' }}>Sign Up</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid #888',
            backgroundColor: 'transparent',
            color: 'white'
          }}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid #888',
            backgroundColor: 'transparent',
            color: 'white'
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid #888',
            backgroundColor: 'transparent',
            color: 'white'
          }}
        />

        <label style={{ color: 'white', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <input
            type="checkbox"
            checked={xpEnabled}
            onChange={e => setXpEnabled(e.target.checked)}
          />
          Enable XP Tracking
        </label>

        <button
          type="submit"
          style={{
            backgroundColor: '#1a1a1a',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Register
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{
            backgroundColor: 'transparent',
            color: 'white',
            textDecoration: 'underline',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            marginTop: '0.5rem'
          }}
        >
          Already have an account? Log In
        </button>
      </form>
    </div>
  );
}




function MainApp({ user, profile }) {


const navigate = useNavigate();

const [allUsers, setAllUsers] = useState([]);

  const [endDate, setEndDate] = useState(() => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // default to today
});
  const [daysShown, setDaysShown] = useState(7);
const [datePage, setDatePage] = useState(0); 

  const [editingHabitId, setEditingHabitId] = useState(null);
const [folders, setFolders] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitInput, setHabitInput] = useState('');
  const [xpInput, setXpInput] = useState('');
  const [inputType, setInputType] = useState('checkbox');
  const [addingSubTo, setAddingSubTo] = useState(null);
  const [subName, setSubName] = useState('');
  const [subXp, setSubXp] = useState('');

  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [folderInput, setFolderInput] = useState('');
const [newFolderName, setNewFolderName] = useState('');
const [activeFolder, setActiveFolder] = useState(null);
const [renamingHabitId, setRenamingHabitId] = useState(null);
const [renamingHabitName, setRenamingHabitName] = useState('');
const [showAddHabitForm, setShowAddHabitForm] = useState(false);
const [showAddFolderForm, setShowAddFolderForm] = useState(false);
const [showJournalEditor, setShowJournalEditor] = useState(false);
const [currentJournalData, setCurrentJournalData] = useState({
  habitId: null,
  date: null,
  value: ''
});




const auth = getAuth();
const loadHabits = async () => {
  if (!user) return;
  try {
    const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const loadedHabits = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    setHabits(loadedHabits);
  } catch (err) {
    console.error('Failed to load habits:', err);
  }
};






useEffect(() => {
  if (!user) return;
  loadHabits();
}, [user]);


  const getThreshold = (level) => {
    let threshold = 100;
    for (let i = 1; i < level; i++) threshold *= 1.25;
    return Math.floor(threshold);
  };

const getPastDates = (days, endDateString) => {
  const end = new Date(endDateString);
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(end);
    date.setDate(end.getDate() - i);
    result.push(date.toISOString().split('T')[0]);
  }
  return result;
};

const visibleDates = getPastDates(daysShown, endDate);



useEffect(() => {
  if (!user) return;

  const loadFolders = async () => {
    try {
      const q = query(collection(db, 'folders'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const folderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFolders(folderList);
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  };

  loadFolders();
}, [user]);


const awardXp = async (amount) => {
  if (!profile.xpEnabled) return;

  try {
    let newXp = profile.xp + amount;
    let newLevel = profile.level;

    while (newXp >= getThreshold(newLevel + 1)) {
      newLevel++;
    }

    const updatedProfile = {
      ...profile,
      xp: newXp,
      level: newLevel,
    };

    const userRef = doc(db, 'profiles', user.uid);
    await setDoc(userRef, updatedProfile, { merge: true });
    // AppRouter will sync the new profile when onAuthStateChanged fires
  } catch (err) {
    console.error('Failed to update XP in Firestore:', err);
  }
};


  
  const handleJournalEntry = async (habitId, date, currentValue, xpValue) => {
    setCurrentJournalData({
  habitId,
  date,
  value: currentValue || ''
});
setShowJournalEditor(true);

  
    try {
      const habitRef = doc(db, 'habits', habitId);
      const snapshot = await getDoc(habitRef);
      if (!snapshot.exists()) return;
    } catch (err) {
      console.error('Failed to save journal entry:', err);
    }
  };
  
  

  const toggleCalendarMark = async (habitId, date, subId = null) => {
    try {
      const habitRef = doc(db, 'habits', habitId);
      const snapshot = await getDoc(habitRef);
      if (!snapshot.exists()) return;
  
      const habitData = snapshot.data();
  
      if (subId === null) {
        // Top-level habit checkbox
        const checked = !!habitData.calendar?.[date];
        const updatedCalendar = { ...(habitData.calendar || {}), [date]: !checked };
  
        await updateDoc(habitRef, { calendar: updatedCalendar });
  
        awardXp(!checked ? habitData.xpValue : -habitData.xpValue);
      } else {
        // Sub-goal checkbox
        const subGoals = habitData.subGoals || [];
        const updatedSubGoals = subGoals.map(sub => {
          if (sub.id !== subId) return sub;
          const checked = !!sub.calendar?.[date];
          const updatedCalendar = { ...(sub.calendar || {}), [date]: !checked };
          awardXp(!checked ? sub.xpValue : -sub.xpValue);
          return { ...sub, calendar: updatedCalendar };
        });
  
        await updateDoc(habitRef, { subGoals: updatedSubGoals });
      }
  
      // Reload habits from Firestore
      const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
      const refreshedSnapshot = await getDocs(q);
      const loadedHabits = refreshedSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setHabits(loadedHabits);
    } catch (err) {
      console.error('Failed to toggle checkbox and update Firestore:', err);
    }
  };
  
const handleDelete = async (id) => {
  try {
    await deleteDoc(doc(db, 'habits', id.toString()));
    await loadHabits();
  } catch (err) {
    console.error('Failed to delete habit from Firestore:', err);
  }
};  

  const handleDeleteSub = async (habitId, subId) => {
    try {
      const habitRef = doc(db, 'habits', habitId);
      const snapshot = await getDoc(habitRef);
      if (!snapshot.exists()) return;
  
      const habitData = snapshot.data();
      const updatedSubGoals = (habitData.subGoals || []).filter(s => s.id !== subId);
  
      await updateDoc(habitRef, { subGoals: updatedSubGoals });
  
      const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
      const refreshed = await getDocs(q);
      const loadedHabits = refreshed.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setHabits(loadedHabits);
    } catch (err) {
      console.error('Failed to delete sub-goal:', err);
    }
  };
  

  const addHabit = async (e) => {
    e.preventDefault();
  
    const name = habitInput.trim();
    const xpVal = parseInt(xpInput, 10);
    if (!name || isNaN(xpVal)) return;
    const newHabit = {
      userId: user.uid,
      inputType,
      name,
      xpValue: xpVal,
      calendar: {},
      values: {},
      subGoals: []
    }; 
    try {
      await addDoc(collection(db, 'habits'), newHabit);
      // Immediately reload all habits from Firestore to reflect the new one
      const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const loadedHabits = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setHabits(loadedHabits);
    } catch (error) {
      console.error('Failed to save habit:', error);
    }
  
    // Clear inputs
    setHabitInput('');
    setXpInput('');
  };
  
  const addSubGoal = async (e, parentId) => {
    e.preventDefault();
    const name = subName.trim();
    const xpVal = parseInt(subXp, 10);
    if (!name || isNaN(xpVal)) return;
  
    const newSub = { id: Date.now(), name, xpValue: xpVal, calendar: {} };
  
    setHabits(prev => {
      const updated = prev.map(h => {
        if (h.id !== parentId) return h;
        return { ...h, subGoals: [...h.subGoals, newSub] };
      });
  
      // Save to Firestore
      const updatedHabit = updated.find(h => h.id === parentId);
      updateDoc(doc(db, 'habits', parentId.toString()), updatedHabit).catch(err =>
        console.error('Failed to update habit with new sub-goal:', err)
      );
  
      return updated;
    });
  
    setAddingSubTo(null);
    setSubName('');
    setSubXp('');
  };
  

  const editHabit = async (id, field, value) => {
    try {
      const habitRef = doc(db, 'habits', id);
      await updateDoc(habitRef, { [field]: value });
  
      const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setHabits(loaded);
    } catch (err) {
      console.error('Failed to edit habit field:', err);
    }
  };
  
  return (
  <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '100%', overflowX: 'auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h1 style={{ margin: 0 }}>Everything Tracker</h1>
      </div>
      <div style={{
  textAlign: 'right',
  fontSize: '0.9rem',
  padding: '0.5rem 1rem',
  backgroundColor: '#1a1a1a',
  color: 'white',
  borderRadius: '8px',
  boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)'
}}>
  <div><strong>{user.email}</strong></div>

  {profile.xpEnabled && (
    <>
      <div><strong>Level:</strong> {profile.level}</div>
      <div><strong>XP:</strong> {profile.xp} / {getThreshold(profile.level + 1)}</div>
    </>
  )}

  

  <button
    onClick={() => signOut(auth)}
    style={{
      marginTop: '0.5rem',
      padding: '0.25rem 0.5rem',
      backgroundColor: '#333',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}
  >
    Log Out
  </button>
  <button
  onClick={() => navigate('/profile')}
  style={{
    marginTop: '0.5rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginLeft: '0.5rem'
  }}
>
  Profile
</button>


</div>

    </div>

    <hr style={{ margin: '1rem 0', border: 'none', borderTop: '2px solid #ccc' }} />


<div style={{ marginBottom: '1rem' }}>
  <strong>Folders: </strong>
  <button
  onClick={() => setActiveFolder(null)}
  style={{
    marginRight: '0.5rem',
    padding: '0.25rem 0.75rem',
    backgroundColor: activeFolder === null ? '#003366' : '#336699',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: activeFolder === null ? 'bold' : 'normal',
    cursor: 'pointer'
  }}
>
  Uncategorized
</button>

{folders.map(f => (
  <span key={f.id} style={{ marginRight: '0.5rem', display: 'inline-flex', alignItems: 'center' }}>
    <button
      onClick={() => setActiveFolder(f.name)}
      style={{
        padding: '0.25rem 0.75rem',
        backgroundColor: activeFolder === f.name ? '#003366' : '#336699',
        color: 'white',
        border: 'none',
        borderRadius: '4px 0 0 4px',
        fontWeight: activeFolder === f.name ? 'bold' : 'normal',
        cursor: 'pointer'
      }}
    >
      {f.name}
    </button>
    <button
      onClick={async () => {
        if (!window.confirm(`Delete folder "${f.name}" and move all habits to Uncategorized?`)) return;

        try {
          // Step 1: Remove the folder from Firestore
          await deleteDoc(doc(db, 'folders', f.id));

          // Step 2: Query all habits in this folder
          const q = query(collection(db, 'habits'), where('userId', '==', user.uid), where('folder', '==', f.name));
          const snapshot = await getDocs(q);
          const batchPromises = snapshot.docs.map(docSnap => {
            const ref = doc(db, 'habits', docSnap.id);
            return updateDoc(ref, { folder: 'Uncategorized' });
          });

          await Promise.all(batchPromises);
          // Step 3: Reload everything
          const habitSnapshot = await getDocs(query(collection(db, 'habits'), where('userId', '==', user.uid)));
          const loadedHabits = habitSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setHabits(loadedHabits);
          const folderSnapshot = await getDocs(query(collection(db, 'folders'), where('userId', '==', user.uid)));
          const loadedFolders = folderSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setFolders(loadedFolders);
          if (activeFolder === f.name) {
            setActiveFolder(null);
          }
        } catch (err) {
          console.error('Failed to delete folder and reassign habits:', err);
        }
      }}
      style={{
        padding: '0.25rem 0.5rem',
        backgroundColor: '#1e3f66'
,
        color: 'white',
        border: 'none',
        borderRadius: '0 4px 4px 0',
        cursor: 'pointer'
      }}
    >
      X
    </button>
  </span>
))}
</div>

     {!showAddHabitForm ? (
  <button
    onClick={() => setShowAddHabitForm(true)}
    style={{ padding: '0.5rem 1rem', marginBottom: '1.5rem' }}
  >
    Add Habit
  </button>
) : (
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      const name = habitInput.trim();
      const xpVal = parseInt(xpInput, 10);
      if (!name || isNaN(xpVal)) return;
      const newHabit = {
        userId: user.uid,
        inputType,
        name,
        xpValue: xpVal,
        calendar: {},
        values: {},
        subGoals: [],
        folder: folderInput || "Uncategorized"
      };
      try {
        await addDoc(collection(db, 'habits'), newHabit);
        const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const loadedHabits = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setHabits(loadedHabits);
      } catch (error) {
        console.error('Failed to save habit:', error);
      }
      setHabitInput('');
      setXpInput('');
      setFolderInput('');
      setShowAddHabitForm(false);
    }}
    style={{ marginBottom: '1.5rem' }}
  >
    <select
      onChange={e => setInputType(e.target.value)}
      style={{ padding: '0.5rem', marginRight: '0.5rem' }}
    >
      <option value="checkbox">Checkbox</option>
      <option value="numeric">Numeric</option>
      <option value="journal">Journal</option>
    </select>
    <input
  type="text"
  placeholder="Habit name"
  value={habitInput}
  onChange={e => setHabitInput(e.target.value)}
  style={{ padding: '0.5rem', width: '30%' }}
/>

{profile.xpEnabled && (
  <input
    type="number"
    placeholder="XP value"
    value={xpInput}
    onChange={e => setXpInput(e.target.value)}
    style={{ padding: '0.5rem', width: '15%', marginLeft: '0.5rem' }}
  />
)}

    <input
      type="text"
      placeholder="Folder"
      value={folderInput}
      onChange={e => setFolderInput(e.target.value)}
      style={{ padding: '0.5rem', width: '15%', marginLeft: '0.5rem' }}
    />
    <button style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>
      Save
    </button>
    <button
      type="button"
      onClick={() => setShowAddHabitForm(false)}
      style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
    >
      Cancel
    </button>
  </form>
)}

{!showAddFolderForm ? (
  <button
    onClick={() => setShowAddFolderForm(true)}
    style={{ padding: '0.5rem 1rem', marginLeft: '1rem' }}
  >
    Add Folder
  </button>
) : (
  <form
    onSubmit={async (e) => {
      e.preventDefault();
      const name = newFolderName.trim();
      if (!name || !user) return;
      try {
        await addDoc(collection(db, 'folders'), {
          name,
          userId: user.uid,
        });

        const snapshot = await getDocs(query(collection(db, 'folders'), where('userId', '==', user.uid)));
        const loadedFolders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setFolders(loadedFolders);

        setNewFolderName('');
        setShowAddFolderForm(false);
      } catch (err) {
        console.error('Failed to create folder:', err);
      }
    }}
    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}
  >
    <input
      type="text"
      placeholder="Folder name"
      value={newFolderName}
      onChange={(e) => setNewFolderName(e.target.value)}
      style={{ padding: '0.5rem' }}
    />
    <button style={{ padding: '0.5rem 1rem' }}>Save</button>
    <button
      type="button"
      onClick={() => {
        setShowAddFolderForm(false);
        setNewFolderName('');
      }}
      style={{ padding: '0.5rem 1rem' }}
    >
      Cancel
    </button>
  </form>
)}
<div style={{ minHeight: '400px' }}>
  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
  {/* <label>
    Show past
    <select
      value={daysShown}
      onChange={(e) => setDaysShown(Number(e.target.value))}
      style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem' }}
    >
      <option value={7}>7 days</option>
      <option value={14}>14 days</option>
      <option value={30}>30 days</option>
      <option value={60}>60 days</option>
      <option value={90}>90 days</option>
    </select>
  </label> */}

  <label>
    End Date
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      max={new Date().toISOString().split('T')[0]}
      style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem' }}
    />
  </label>
</div>


      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>

            <th style={{ borderBottom: '1px solid #333', padding: '0.5rem', textAlign: 'left' }}>
  Habit / Sub-goal
</th>
            <th style={{ borderBottom: '1px solid #333', padding: '0.5rem' }}>XP</th>
            {visibleDates.map(date => (
              <th key={date} style={{ borderBottom: '1px solid #333', padding: '0.5rem', whiteSpace: 'nowrap' }}>{date.slice(5)}</th>
            ))}
            <th style={{ borderBottom: '1px solid #333', padding: '0.5rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {[...habits]
  .filter(h => {
    if (activeFolder === null) {
      return !h.folder || h.folder === "Uncategorized";
    }
    return h.folder === activeFolder;
  })
  .map(h => (
            <React.Fragment key={h.id}>
              <tr style={{ borderBottom: '1px solid #111' }}>

                <td style={{ padding: '0.5rem' }}>
  {h.name}
</td>

                <td style={{ textAlign: 'center' }}>{h.xpValue}</td>
                {visibleDates.map(date => (
                  <td key={date} style={{ textAlign: 'center' }}>
                    {h.inputType === 'journal' ? (
                      <button
                      onClick={() => handleJournalEntry(h.id, date, h.values?.[date], h.xpValue)}
                      style={{
  width: '100%',
  padding: '0.25rem 0.5rem',
  fontSize: '0.85rem',
  lineHeight: '1.2',
  backgroundColor: '#222',
  color: 'white',
  border: '1px solid #444',
  borderRadius: '10px',
  cursor: 'pointer'
}}

                    >
                      {h.values?.[date] ? 'View/Edit' : 'Add Entry'}
                    </button>
                      
                    ) : h.inputType === 'numeric' ? (
                      <NumericInputCell
  habit={h}
  date={date}
  xp={h.xpValue}
  onSave={async (newValue) => {
    try {
      const habitRef = doc(db, 'habits', h.id);
      const snapshot = await getDoc(habitRef);
      if (!snapshot.exists()) return;
      const habitData = snapshot.data();
      const alreadyLogged = !!habitData.values?.[date];

      const updatedValues = { ...(habitData.values || {}), [date]: newValue };
      await updateDoc(habitRef, { values: updatedValues });

      if (!alreadyLogged && newValue !== '') {
        awardXp(h.xpValue);
      }

      await loadHabits(); // Refresh state after save
    } catch (err) {
      console.error('Failed to save numeric input:', err);
    }
  }}
/>


                    ) : (
                      <input
                        type="checkbox"
                        checked={!!h.calendar?.[date]}
                        onChange={() => toggleCalendarMark(h.id, date)}
                      />
                    )}
                  </td>
                ))}
                <td style={{ position: 'relative' }}>
  {editingHabitId === h.id ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <button onClick={() => handleDelete(h.id)}>Delete</button>
      <button onClick={() => setAddingSubTo(h.id)}>Add Sub-goal</button>
      <div>
        <label style={{ fontSize: '0.85rem' }}>Add to Folder:</label>
        <select
          onChange={async (e) => {
            const folderName = e.target.value;
            if (!folderName) return;
            try {
              const habitRef = doc(db, 'habits', h.id);
              await updateDoc(habitRef, { folder: folderName });
              const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
              const snapshot = await getDocs(q);
              const loadedHabits = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
              setHabits(loadedHabits);
            } catch (err) {
              console.error('Failed to update folder:', err);
            }
          }}
          defaultValue=""
          style={{ padding: '0.25rem', marginTop: '0.25rem', width: '100%' }}
        >
          <option value="" disabled>Select folder</option>
          {folders.map(f => (
            <option key={f.id} value={f.name}>{f.name}</option>
          ))}
        </select>
      </div>
        <button
    onClick={async () => {
      try {
        const habitRef = doc(db, 'habits', h.id);
        await updateDoc(habitRef, { folder: "Uncategorized" });
        const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const loadedHabits = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setHabits(loadedHabits);
      } catch (err) {
        console.error('Failed to remove folder:', err);
      }
    }}
    style={{
  marginTop: '0.25rem',
  backgroundColor: '#336699',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  padding: '0.25rem 0.5rem',
  cursor: 'pointer'
}}
  >
    Remove from Folder
  </button>
      <button
        onClick={() => setEditingHabitId(null)}
        style={{ marginTop: '0.25rem' }}
      >
        Done
      </button>
    </div>
  ) : (
    <button
  onClick={() => setEditingHabitId(h.id)}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
  Edit
</button>

  )}
</td>
              </tr>
              {h.subGoals.map(s => (
                <tr key={s.id}>
                  <td style={{ padding: '0.5rem 0.5rem 0.5rem 2rem' }}>{s.name}</td>
                  <td style={{ textAlign: 'center' }}>{s.xpValue}</td>
                  {visibleDates.map(date => (
                    <td key={date} style={{ textAlign: 'center' }}>
                      <input type="checkbox" checked={!!s.calendar?.[date]} onChange={() => toggleCalendarMark(h.id, date, s.id)} />
                    </td>
                  ))}
                  <td>
                    <button onClick={() => handleDeleteSub(h.id, s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {addingSubTo === h.id && (
                <tr>
                  <td colSpan={32}>
                    <form onSubmit={e => addSubGoal(e, h.id)}>
                      <input type="text" placeholder="Sub-goal name" value={subName} onChange={e => setSubName(e.target.value)} style={{ padding: '0.25rem', width: '40%' }} />
                      <input type="number" placeholder="XP" value={subXp} onChange={e => setSubXp(e.target.value)} style={{ padding: '0.25rem', width: '8rem', marginLeft: '0.5rem' }} />
                      <button style={{ marginLeft: '0.5rem' }}>Save</button>
                      <button type="button" onClick={() => setAddingSubTo(null)} style={{ marginLeft: '0.5rem' }}>Cancel</button>
                    </form>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      </div>
    {showJournalEditor && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    }}
  >
    <div
  style={{
    width: '90vw',
    maxWidth: '700px',
    height: '85vh',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',       // Slight transparency
    backdropFilter: 'blur(10px)',                      // Frosted blur
    WebkitBackdropFilter: 'blur(10px)',                // Safari support
    border: '1px solid rgba(255, 255, 255, 0.2)',       // Light border
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(0, 0, 0, 0.2)',           // Soft shadow
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
    overflow: 'hidden',                                // Ensures no internal overflow
  }}
>
      <h2 style={{ marginTop: 0 }}>Journal Entry – {currentJournalData.date}</h2>
      <textarea
        value={currentJournalData.value}
        onChange={(e) =>
          setCurrentJournalData((prev) => ({
            ...prev,
            value: e.target.value,
          }))
        }
        style={{
  flex: 1,
  padding: '1rem',
  fontSize: '1rem',
  resize: 'none',
  marginBottom: '1rem',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',              // Ensures padding doesn't overflow container
  border: '1px solid #ccc',
  borderRadius: '8px',
  backgroundColor: 'rgba(2, 2, 2, 0.8)',
  outline: 'none',
}}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button
          onClick={async () => {
            try {
              const habitRef = doc(db, 'habits', currentJournalData.habitId);
              const snapshot = await getDoc(habitRef);
              if (!snapshot.exists()) return;
              const habitData = snapshot.data();
              const alreadyLogged = !!habitData.values?.[currentJournalData.date];
              const updatedValues = {
                ...(habitData.values || {}),
                [currentJournalData.date]: currentJournalData.value,
              };
              await updateDoc(habitRef, { values: updatedValues });
              if (!alreadyLogged && currentJournalData.value.trim() !== '') {
                awardXp(habitData.xpValue);
              }
              await loadHabits();
              setShowJournalEditor(false);
              setCurrentJournalData({ habitId: null, date: null, value: '' });
            } catch (err) {
              console.error('Failed to save journal entry:', err);
            }
          }}
        >
          Save
        </button>
        <button
          onClick={() => {
            setShowJournalEditor(false);
            setCurrentJournalData({ habitId: null, date: null, value: '' });
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
  
)}



<footer
  style={{
    marginTop: '2rem',
    padding: '1rem',
    textAlign: 'center',
    color: '#888',
    fontSize: '0.85rem'
  }}
>
  © {new Date().getFullYear()} Everything Tracker by Brian Ashcraft
</footer>

</div>

  );

}
export default AppRouter;
