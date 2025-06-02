import React from 'react';

// Define the available tones
const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'concise', label: 'Concise' },
  { id: 'pirate', label: 'Pirate 🏴‍☠️' },
  { id: 'very angry', label: 'Very Angry 😡' },
  { id: 'ultra formal', label: 'Ultra Formal 🧐' },
  { id: 'casual and lazy', label: 'Casual and Lazy 😴' },
  { id: 'motivational speaker', label: 'Motivational Speaker 🎤' },
  { id: 'passive aggressive', label: 'Passive Aggressive 😇🔪' },
];

function ToneSelector({ selectedTone, onToneChange }) {
  return (
    <div>
      <label htmlFor="tone-selector" style={{ marginRight: '10px' }}>Choose a tone:</label>
      <select
        id="tone-selector"
        value={selectedTone}
        onChange={(e) => onToneChange(e.target.value)}
      >
        {TONES.map(tone => (
          <option key={tone.id} value={tone.id}>
            {tone.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ToneSelector;
