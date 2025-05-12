import React, { useState, useEffect } from 'react';
import { getDocs, query, where } from 'firebase/firestore'; 
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { setDoc, doc, updateDoc } from 'firebase/firestore';


function App() {
  const [habits, setHabits] = useState([]);
  const [habitInput, setHabitInput] = useState('');
  const [xpInput, setXpInput] = useState('');
  const [inputType, setInputType] = useState('checkbox');
  const [profile, setProfile] = useState({ xp: 0, level: 0 });
  const [addingSubTo, setAddingSubTo] = useState(null);
  const [subName, setSubName] = useState('');
  const [subXp, setSubXp] = useState('');


  const auth = getAuth();

  const [user, setUser] = useState(null);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');



useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUser(user);
  });
  return () => unsubscribe();
}, []);

useEffect(() => {
  if (!user) return;

  const loadHabits = async () => {
    try {
      const q = query(collection(db, 'habits'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const loadedHabits = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setHabits(loadedHabits);
    } catch (err) {
      console.error('Failed to load habits:', err);
    }
  };

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



  const awardXp = (amount) => {
    setProfile(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
  
      while (newXp >= getThreshold(newLevel + 1)) {
        newLevel++;
      }
  
      return { xp: newXp, level: newLevel };
    });
  };
  

  const toggleCalendarMark = (habitId, date, subId = null) => {
    setHabits(prev =>
      prev.map(h => {
        if (h.id !== habitId) return h;
  
        let updatedHabit = { ...h };
  
        if (subId === null) {
          const checked = !!h.calendar?.[date];
          const updatedCalendar = { ...h.calendar, [date]: !checked };
          awardXp(!checked ? h.xpValue : -h.xpValue);
          updatedHabit.calendar = updatedCalendar;
        } else {
          const newSubGoals = h.subGoals.map(s => {
            if (s.id !== subId) return s;
            const checked = !!s.calendar?.[date];
            const updatedCalendar = { ...s.calendar, [date]: !checked };
            awardXp(!checked ? s.xpValue : -s.xpValue);
            return { ...s, calendar: updatedCalendar };
          });
          updatedHabit.subGoals = newSubGoals;
        }
  
        const habitRef = doc(db, 'habits', h.id.toString());
        updateDoc(habitRef, updatedHabit).catch(err =>
          console.error('Failed to save habit', err)
        );
  
        return updatedHabit;
      })
    );
  };
  


  const handleDelete = id => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const handleDeleteSub = (habitId, subId) => {
    setHabits(prev =>
      prev.map(h => {
        if (h.id !== habitId) return h;
        return { ...h, subGoals: h.subGoals.filter(s => s.id !== subId) };
      })
    );
  };

  const addHabit = async (e) => {
    e.preventDefault();
    const name = habitInput.trim();
    const xpVal = parseInt(xpInput, 10);
    if (!name || isNaN(xpVal)) return;
  
    const now = Date.now();
    const newHabit = {
      id: now,
      userId: user.uid,
      inputType,
      name,
      xpValue: xpVal,
      calendar: {},
      values: {},
      subGoals: []
    };
  
    try {
      await setDoc(doc(db, 'habits', now.toString()), newHabit);
      setHabits(prev => [...prev, newHabit]);
    } catch (error) {
      console.error('Failed to save habit:', error);
    }
  
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
  

  const editHabit = (id, field, value) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h));
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

      <h1>Habit Loop</h1>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Level:</strong> {profile.level}<br />
        <strong>XP:</strong> {profile.xp} / {getThreshold(profile.level + 1)}
      </div>

      <form onSubmit={addHabit} style={{ marginBottom: '1.5rem' }}>
        <select onChange={e => setInputType(e.target.value)} style={{ padding: '0.5rem', marginRight: '0.5rem' }}>
          <option value="checkbox">Checkbox</option>
          <option value="numeric">Numeric</option>
          <option value="journal">Journal</option>
        </select>
        <input type="text" placeholder="Habit name" value={habitInput} onChange={e => setHabitInput(e.target.value)} style={{ padding: '0.5rem', width: '40%' }} />
        <input type="number" placeholder="XP value" value={xpInput} onChange={e => setXpInput(e.target.value)} style={{ padding: '0.5rem', width: '15%', marginLeft: '0.5rem' }} />
        <button style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>Add Habit</button>
      </form>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #333', padding: '0.5rem' }}>Habit / Sub-goal</th>
            <th style={{ borderBottom: '1px solid #333', padding: '0.5rem' }}>XP</th>
            {past30Days.map(date => (
              <th key={date} style={{ borderBottom: '1px solid #333', padding: '0.5rem', whiteSpace: 'nowrap' }}>{date.slice(5)}</th>
            ))}
            <th style={{ borderBottom: '1px solid #333', padding: '0.5rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {habits.map(h => (
            <React.Fragment key={h.id}>
              <tr>
                <td style={{ padding: '0.5rem' }}>
                  <input type="text" value={h.name} onChange={e => editHabit(h.id, 'name', e.target.value)} style={{ width: '90%' }} />
                </td>
                <td style={{ textAlign: 'center' }}>{h.xpValue}</td>
                {past30Days.map(date => (
                  <td key={date} style={{ textAlign: 'center' }}>
                    {h.inputType === 'journal' ? (
                      <button onClick={() => {
                        const entry = prompt('Journal entry:', h.values?.[date] || '');
                        if (entry !== null) {
                          const alreadyLogged = !!h.values?.[date];
                          setHabits(prev => prev.map(hh => {
                            if (hh.id !== h.id) return hh;
                            const updated = {
                              ...hh,
                              values: { ...hh.values, [date]: entry }
                            };
                            if (!alreadyLogged && entry.trim() !== '') {
                              awardXp(h.xpValue);
                            }
                            return updated;
                          }));
                        }
                      }} style={{ width: '100%' }}>
                        {h.values?.[date] ? 'View Entry' : 'Add Entry'}
                      </button>
                      
                    ) : h.inputType === 'numeric' ? (
                      <input
  type="number"
  value={h.values?.[date] || ''}
  onChange={e => {
    const value = e.target.value;
    const alreadyLogged = h.values?.[date];
    setHabits(prev => prev.map(hh => {
      if (hh.id !== h.id) return hh;
      const updated = {
        ...hh,
        values: { ...hh.values, [date]: value }
      };
      if (!alreadyLogged && value !== '') {
        awardXp(h.xpValue);
      }
      return updated;
    }));
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
                <td>
                  <button onClick={() => handleDelete(h.id)}>Delete</button>
                  <button onClick={() => setAddingSubTo(h.id)} style={{ marginLeft: '0.5rem' }}>Add Sub-goal</button>
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
  );
}

export default App;