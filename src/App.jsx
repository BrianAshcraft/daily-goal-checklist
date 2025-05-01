import { useState, useEffect, useRef } from 'react';

function App() {
  const [habits, setHabits] = useState([]);
  const [habitInput, setHabitInput] = useState('');
  const isInitialMount = useRef(true);

  // Days for our columns
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // 1. Load saved habits once, and ensure each has a 7-slot checks array
  useEffect(() => {
    const raw = localStorage.getItem('habits');
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const normalized = arr.map(h => ({
            id: h.id,
            name: h.name,
            checks: Array.isArray(h.checks) && h.checks.length === 7
              ? h.checks
              : Array(7).fill(false)
          }));
          setHabits(normalized);
        }
      } catch (err) {
        console.error('Could not parse habits', err);
      }
    }
  }, []);

  // 2. Save on every update (skip first mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  // 3. Add a new habit with an empty checks array
  const handleAddHabit = e => {
    e.preventDefault();
    const name = habitInput.trim();
    if (!name) return;
    setHabits(prev => [
      ...prev,
      { id: Date.now(), name, checks: Array(7).fill(false) }
    ]);
    setHabitInput('');
  };

  // 4. Delete by ID
  const handleDeleteHabit = id => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  // 5. Toggle a specific day checkbox
  const handleToggle = (habitId, dayIndex) => {
    setHabits(prev =>
      prev.map(h =>
        h.id === habitId
          ? {
              ...h,
              checks: h.checks.map((c, i) =>
                i === dayIndex ? !c : c
              )
            }
          : h
      )
    );
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Habit Loop</h1>
      <form onSubmit={handleAddHabit} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={habitInput}
          onChange={e => setHabitInput(e.target.value)}
          placeholder="Enter a habit..."
          style={{ padding: '0.5rem', width: '70%' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>
          Add
        </button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '2px solid #333', textAlign: 'left', padding: '0.5rem' }}>
              Habit
            </th>
            {daysOfWeek.map(d => (
              <th
                key={d}
                style={{ borderBottom: '2px solid #333', padding: '0.5rem', textAlign: 'center' }}
              >
                {d}
              </th>
            ))}
            <th style={{ borderBottom: '2px solid #333', padding: '0.5rem' }}></th>
          </tr>
        </thead>
        <tbody>
          {habits.map(h => (
            <tr key={h.id}>
              <td style={{ padding: '0.5rem' }}>
                {h.name}
              </td>
              {h.checks.map((checked, idx) => (
                <td key={idx} style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle(h.id, idx)}
                  />
                </td>
              ))}
              <td style={{ padding: '0.5rem' }}>
                <button onClick={() => handleDeleteHabit(h.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
