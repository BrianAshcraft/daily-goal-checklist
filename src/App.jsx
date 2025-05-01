import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [habits, setHabits] = useState([]);
  const [habitInput, setHabitInput] = useState('');
  const [xpInput, setXpInput] = useState('');
  const [profile, setProfile] = useState({ xp: 0, level: 0 });
  const [addingSubTo, setAddingSubTo] = useState(null);
  const [subName, setSubName] = useState('');
  const [subXp, setSubXp] = useState('');
  const isInit = useRef(true);

  // Count days inclusive
  const daysBetween = (start, end) => {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((end - start) / msPerDay) + 1;
  };

  // XP needed for each level
  const getThreshold = level => {
    let threshold = 100;
    for (let i = 1; i < level; i++) threshold *= 1.25;
    return Math.floor(threshold);
  };

  // Load habits + profile
  useEffect(() => {
    const rawHabits = localStorage.getItem('habits');
    if (rawHabits) {
      try {
        const parsed = JSON.parse(rawHabits);
        const today = new Date();
        setHabits(parsed.map(h => {
          const created = new Date(h.createdAt);
          const totalDays = daysBetween(created, today);
          const checks = Array.isArray(h.checks) ? [...h.checks] : [];
          while (checks.length < totalDays) checks.push(false);

          const subs = Array.isArray(h.subGoals)
            ? h.subGoals.map(s => {
                const subChecks = Array.isArray(s.checks) ? [...s.checks] : [];
                while (subChecks.length < totalDays) subChecks.push(false);
                return { ...s, checks: subChecks };
              })
            : [];

          return {
            ...h,
            checks,
            subGoals: subs,
            xpValue: typeof h.xpValue === 'number' ? h.xpValue : 0
          };
        }));
      } catch (err) {
        console.error('Failed to parse habits', err);
      }
    }

    const rawProfile = localStorage.getItem('profile');
    if (rawProfile) {
      try {
        setProfile(JSON.parse(rawProfile));
      } catch (err) {
        console.error('Failed to parse profile', err);
      }
    }
  }, []);

  // Persist habits (skip very first run)
  useEffect(() => {
    if (isInit.current) {
      isInit.current = false;
    } else {
      localStorage.setItem('habits', JSON.stringify(habits));
    }
  }, [habits]);

  // Persist profile
  useEffect(() => {
    localStorage.setItem('profile', JSON.stringify(profile));
  }, [profile]);

  // Award or remove XP and recalc level
  const awardXp = delta => {
    setProfile(prev => {
      const newXp = prev.xp + delta;
      let newLevel = 0;
      while (newXp >= getThreshold(newLevel + 1)) newLevel++;
      return { xp: newXp, level: newLevel };
    });
  };

  // Toggle a checkbox (parent or sub-goal)
  const handleToggle = (habitId, dayIndex, subId = null) => {
    setHabits(prev =>
      prev.map(h => {
        if (h.id !== habitId) return h;

        // Parent habit toggle
        if (subId == null) {
          const newChecks = h.checks.map((c, i) => {
            if (i === dayIndex) {
              awardXp(c ? -h.xpValue : h.xpValue);
              return !c;
            }
            return c;
          });
          return { ...h, checks: newChecks };
        }

        // Sub-goal toggle
        const newSubs = h.subGoals.map(s => {
          if (s.id !== subId) return s;
          const newChecks = s.checks.map((c, i) => {
            if (i === dayIndex) {
              awardXp(c ? -s.xpValue : s.xpValue);
              return !c;
            }
            return c;
          });
          return { ...s, checks: newChecks };
        });
        return { ...h, subGoals: newSubs };
      })
    );
  };

  // Add a new habit
  const addHabit = e => {
    e.preventDefault();
    const name = habitInput.trim();
    const xpVal = parseInt(xpInput, 10);
    if (!name || isNaN(xpVal)) return;
    const now = Date.now();
    setHabits(prev => [
      ...prev,
      { id: now, name, createdAt: now, xpValue: xpVal, checks: [false], subGoals: [] }
    ]);
    setHabitInput('');
    setXpInput('');
  };

  // Add a sub-goal under a habit
  const addSubGoal = (e, parentId) => {
    e.preventDefault();
    const name = subName.trim();
    const xpVal = parseInt(subXp, 10);
    if (!name || isNaN(xpVal)) return;
    setHabits(prev =>
      prev.map(h => {
        if (h.id !== parentId) return h;
        const newSub = {
          id: Date.now(),
          name,
          xpValue: xpVal,
          checks: Array(h.checks.length).fill(false)
        };
        return { ...h, subGoals: [...h.subGoals, newSub] };
      })
    );
    setAddingSubTo(null);
    setSubName('');
    setSubXp('');
  };

  // Inline edit habit fields
  const editHabit = (id, field, value) => {
    setHabits(prev =>
      prev.map(h => (h.id === id ? { ...h, [field]: value } : h))
    );
  };

  // How many day-columns to render
  const totalCols = habits.length
    ? daysBetween(
        new Date(Math.min(...habits.map(h => h.createdAt))),
        new Date()
      )
    : 0;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Habit Loop</h1>

      {/* Profile */}
      <div style={{ marginBottom: '1rem' }}>
        <strong>Level:</strong> {profile.level}<br/>
        <strong>XP:</strong> {profile.xp} / {getThreshold(profile.level + 1)}
      </div>

      {/* New habit form */}
      <form onSubmit={addHabit} style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Habit name"
          value={habitInput}
          onChange={e => setHabitInput(e.target.value)}
          style={{ padding: '0.5rem', width: '40%' }}
        />
        <input
          type="number"
          placeholder="XP value"
          value={xpInput}
          onChange={e => setXpInput(e.target.value)}
          style={{ padding: '0.5rem', width: '15%', marginLeft: '0.5rem' }}
        />
        <button style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>
          Add Habit
        </button>
      </form>

      {/* Habits table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '2px solid #333', padding: '0.5rem', textAlign: 'left' }}>
              Habit / Sub-goal
            </th>
            <th style={{ borderBottom: '2px solid #333', padding: '0.5rem', textAlign: 'center' }}>
              XP/day
            </th>
            {Array.from({ length: totalCols }, (_, i) => (
              <th
                key={i}
                style={{ borderBottom: '2px solid #333', padding: '0.5rem', textAlign: 'center' }}
              >
                Day {i + 1}
              </th>
            ))}
            <th style={{ borderBottom: '2px solid #333', padding: '0.5rem', textAlign: 'center' }}>
              Progress
            </th>
            <th style={{ borderBottom: '2px solid #333', padding: '0.5rem' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {habits.map(h => {
            const done = h.checks.filter(Boolean).length;
            const total = h.checks.length;
            return (
              <React.Fragment key={h.id}>
                {/* Parent row */}
                <tr>
                  <td style={{ padding: '0.5rem' }}>
                    <input
                      type="text"
                      value={h.name}
                      onChange={e => editHabit(h.id, 'name', e.target.value)}
                      style={{ width: '90%', padding: '0.25rem' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <input
                      type="number"
                      value={h.xpValue}
                      onChange={e => editHabit(h.id, 'xpValue', Number(e.target.value))}
                    />
                  </td>
                  {h.checks.map((c, idx) => (
                    <td key={idx} style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={c}
                        onChange={() => handleToggle(h.id, idx)}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    {done}/{total}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <button onClick={() => setAddingSubTo(h.id)}>
                      Add Sub-goal
                    </button>
                  </td>
                </tr>

                {/* Sub-goals */}
                {h.subGoals.map(s => {
                  const sd = s.checks.filter(Boolean).length;
                  const st = s.checks.length;
                  return (
                    <tr key={s.id}>
                      <td style={{ padding: '0.5rem 0.5rem 0.5rem 2rem' }}>
                        {s.name}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        {s.xpValue}
                      </td>
                      {s.checks.map((c, idx) => (
                        <td key={idx} style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={c}
                            onChange={() => handleToggle(h.id, idx, s.id)}
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        {sd}/{st}
                      </td>
                      <td style={{ padding: '0.5rem' }} />
                    </tr>
                  );
                })}

                {/* Add sub-goal form */}
                {addingSubTo === h.id && (
                  <tr>
                    <td colSpan={2} style={{ padding: '0.5rem' }}>
                      <form onSubmit={e => addSubGoal(e, h.id)}>
                        <input
                          type="text"
                          placeholder="Sub-goal name"
                          value={subName}
                          onChange={e => setSubName(e.target.value)}
                          style={{ padding: '0.25rem', width: '40%' }}
                        />
                        <input
                          type="number"
                          placeholder="XP"
                          value={subXp}
                          onChange={e => setSubXp(e.target.value)}
                          style={{ padding: '0.25rem', width: '8rem', marginLeft: '0.5rem' }}
                        />
                        <button style={{ marginLeft: '0.5rem' }}>Save</button>
                        <button
                          type="button"
                          onClick={() => setAddingSubTo(null)}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Cancel
                        </button>
                      </form>
                    </td>
                    <td colSpan={totalCols + 3} />
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;
