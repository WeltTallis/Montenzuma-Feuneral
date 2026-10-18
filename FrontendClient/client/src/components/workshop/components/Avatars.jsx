import React from 'react';

/* ============================================================================
   Avatars — worker avatar stack with optional "more" count.
   ============================================================================ */
const Avatars = ({ workers, max = 4, size = 28 }) => {
  const visible = workers.slice(0, max);
  const more = workers.length > max ? workers.length - max : 0;

  const AVATAR_COLORS = [
    '#ff7e5f', '#43cea2', '#f4c430', '#7b6cff', '#00d4ff', '#c86dd7', '#ea580c', '#0d9488',
  ];

  return (
    <div className="ec-avatars">
      {visible.map((w, i) => {
        const initials = w.name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
        const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
        return (
          <span
            key={w.id}
            className="ec-avatar"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)`, title: w.name }}
          >
            {initials}
          </span>
        );
      })}
      {more > 0 && (
        <span className="ec-avatar ec-avatar-more">+{more}</span>
      )}
    </div>
  );
};

export default Avatars;