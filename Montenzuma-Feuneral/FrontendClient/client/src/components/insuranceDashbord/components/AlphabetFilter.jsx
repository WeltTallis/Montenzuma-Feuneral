import React from 'react';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export default function AlphabetFilter({ selected, counts, onSelect }) {
  return <div className="insdash-alphabet" aria-label="Filter members by first name"><button className={!selected ? 'is-selected' : ''} onClick={() => onSelect('')}>All</button>{ALPHABET.map(letter => <button key={letter} disabled={!counts[letter]} className={selected === letter ? 'is-selected' : ''} onClick={() => onSelect(letter)} aria-label={`${letter}, ${counts[letter] || 0} members`}>{letter}<span>{counts[letter] || ''}</span></button>)}</div>;
}
