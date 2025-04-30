import { useState, useEffect, useRef } from 'react';

function App() {
  const [habits, setHabits] = useState([]);
  const [habitInput, setHabitInput] = useState('');
  const isInitialMount = useRef(true);

  // 1. Load saved habits once
  useEffect(() => {
    const raw = localStorage.getItem('habits');
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setHabits(arr);
      } catch (err) {
        console.error('Could not parse habits', err);
      }
    }
  }, []);

  // 2. Save on every update except the very first render
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!habitInput.trim()) return;
    setHabits((prev) => [...prev, { id: Date.now(), name: habitInput }]);
    setHabitInput('');
  };

  const handleDeleteHabit = (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Habit Loop</h1>
      <form onSubmit={handleAddHabit} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={habitInput}
          onChange={(e) => setHabitInput(e.target.value)}
          placeholder="Enter a habit..."
          style={{ padding: '0.5rem', width: '80%' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>Add</button>
      </form>
      <ul>
        {habits.map((h) => (
          <li key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span>{h.name}</span>
            <button onClick={() => handleDeleteHabit(h.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

