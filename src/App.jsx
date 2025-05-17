import React, { useState, useEffect } from 'react';
import { getDocs, query, where } from 'firebase/firestore'; 
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { setDoc, doc, updateDoc } from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';





function App() {

  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return user ? <MainApp user={user} /> : <LoginScreen />;
}
  function LoginScreen() {
  const auth = getAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // prevent page reload
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#111',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif'
      }}
    >
      <h2>Welcome to Habit Tracker</h2>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            margin: '0.5rem 0',
            padding: '0.75rem',
            width: '250px',
            borderRadius: '6px',
            border: '1px solid #ccc'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            width: '250px',
            borderRadius: '6px',
            border: '1px solid #ccc'
          }}
        />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" style={{ padding: '0.75rem 1.5rem' }}>
            Log In
          </button>
          <button
            type="button"
            onClick={() => createUserWithEmailAndPassword(auth, email, password)}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
}




function MainApp({ user }) {
  
  const [editingHabitId, setEditingHabitId] = useState(null);
const [folders, setFolders] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitInput, setHabitInput] = useState('');
  const [xpInput, setXpInput] = useState('');
  const [inputType, setInputType] = useState('checkbox');
  const [profile, setProfile] = useState({ xp: 0, level: 0 });
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

  const loadProfile = async () => {
    try {
      const userRef = doc(db, 'profiles', user.uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        setProfile(snapshot.data());
      } else {
        // Set a new profile if it doesn't exist
        await setDoc(userRef, { xp: 0, level: 0 });
        setProfile({ xp: 0, level: 0 });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  loadProfile();
}, [user]);


useEffect(() => {
  if (!user) return;
  loadHabits();
}, [user]);


  const getThreshold = (level) => {
    let threshold = 100;
    for (let i = 1; i < level; i++) threshold *= 1.25;
    return Math.floor(threshold);
  };

  const getPastDates = (days) => {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      result.push(date.toISOString().split('T')[0]);
    }
    return result;
  };

  const past30Days = getPastDates(7);

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


  const awardXp = (amount) => {
    setProfile(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
  
      while (newXp >= getThreshold(newLevel + 1)) {
        newLevel++;
      }
  
      const updatedProfile = { xp: newXp, level: newLevel };
  

      if (user) {
        const userRef = doc(db, 'profiles', user.uid);
        setDoc(userRef, updatedProfile, { merge: true }).catch(err =>
          console.error('Failed to save profile:', err)
        );
      }
  
      return updatedProfile;
    });
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
    {!user ? (
      <div style={{ marginBottom: '1rem' }}>
        <h3>Login or Sign Up</h3>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginRight: '0.5rem' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginRight: '0.5rem' }}
        />
        <button onClick={() => createUserWithEmailAndPassword(auth, email, password)}>Sign Up</button>
        <button onClick={() => signInWithEmailAndPassword(auth, email, password)}>Log In</button>
      </div>
    ) : (
      <div style={{ marginBottom: '1rem' }}>
        Logged in as <strong>{user.email}</strong>
        <button onClick={() => signOut(auth)} style={{ marginLeft: '1rem' }}>Log Out</button>
      </div>
    )}

      <div
  style={{
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #ccc',
  }}
>
  <h1 style={{ margin: 0 }}>Everything Tracker</h1>
  <div>
    <strong>Level:</strong> {profile.level}<br />
    <strong>XP:</strong> {profile.xp} / {getThreshold(profile.level + 1)}
  </div>
</div>




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

    <input
      type="number"
      placeholder="XP value"
      value={xpInput}
      onChange={e => setXpInput(e.target.value)}
      style={{ padding: '0.5rem', width: '15%', marginLeft: '0.5rem' }}
    />

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
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #333', padding: '0.5rem', textAlign: 'left' }}>
  Habit / Sub-goal
</th>

            <th style={{ borderBottom: '1px solid #333', padding: '0.5rem' }}>XP</th>
            {past30Days.map(date => (
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
              <tr>
                <td style={{ padding: '0.5rem' }}>
  {renamingHabitId === h.id ? (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      <input
        type="text"
        value={renamingHabitName}
        onChange={e => setRenamingHabitName(e.target.value)}
        style={{ width: '70%' }}
      />
      <button
        onClick={async () => {
          try {
            const habitRef = doc(db, 'habits', h.id);
            await updateDoc(habitRef, { name: renamingHabitName });

            const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
            const snapshot = await getDocs(q);
            const loadedHabits = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setHabits(loadedHabits);

            setRenamingHabitId(null);
            setRenamingHabitName('');
          } catch (err) {
            console.error('Failed to save habit name:', err);
          }
        }}
      >
        Save
      </button>
      <button onClick={() => {
        setRenamingHabitId(null);
        setRenamingHabitName('');
      }}>
        Cancel
      </button>
    </div>
  ) : (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{h.name}</span>
      <button
  onClick={() => {
    setRenamingHabitId(h.id);
    setRenamingHabitName(h.name);
  }}
  style={{
    marginLeft: '0.5rem',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  }}
  title="Edit"
  aria-label="Edit"
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
    style={{ display: 'block' }}
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
</button>
    </div>
  )}
</td>
                <td style={{ textAlign: 'center' }}>{h.xpValue}</td>
                {past30Days.map(date => (
                  <td key={date} style={{ textAlign: 'center' }}>
                    {h.inputType === 'journal' ? (
                      <button
                      onClick={() => handleJournalEntry(h.id, date, h.values?.[date], h.xpValue)}
                      style={{ width: '100%' }}
                    >
                      {h.values?.[date] ? 'View Entry' : 'Add Entry'}
                    </button>
                      
                    ) : h.inputType === 'numeric' ? (
                      <input
  type="number"
  value={h.values?.[date] || ''}
  onChange={async (e) => {
    const value = e.target.value;

    try {
      const habitRef = doc(db, 'habits', h.id);
      const snapshot = await getDoc(habitRef);
      if (!snapshot.exists()) return;

      const habitData = snapshot.data();
      const alreadyLogged = !!habitData.values?.[date];

      const updatedValues = { ...(habitData.values || {}), [date]: value };

      await updateDoc(habitRef, { values: updatedValues });

      if (!alreadyLogged && value !== '') {
        awardXp(h.xpValue);
      }

      const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
      const refreshedSnapshot = await getDocs(q);
      const loadedHabits = refreshedSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setHabits(loadedHabits);
    } catch (err) {
      console.error('Failed to update numeric input:', err);
    }
  }}
  style={{ width: '4rem' }}
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
    <button onClick={() => setEditingHabitId(h.id)}>Edit</button>
  )}
</td>

              </tr>
              {h.subGoals.map(s => (
                <tr key={s.id}>
                  <td style={{ padding: '0.5rem 0.5rem 0.5rem 2rem' }}>{s.name}</td>
                  <td style={{ textAlign: 'center' }}>{s.xpValue}</td>
                  {past30Days.map(date => (
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

</div>
  );
}


export default App;