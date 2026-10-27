import React, { useState } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
`;

const CloseBtn = styled.button`
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
`;

const ScheduleBtn = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background-color: ${(p) => (p.$disabled ? '#cbd5e1' : '#2563eb')};
  color: white;
  font-weight: 600;
  cursor: pointer;
  opacity: ${(p) => (p.$disabled ? 0.6 : 1)};
`;

const ScheduleDispatchModal = ({ deceasedId, onClose, onSchedule }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const year = today.getFullYear();
  const minDate = `${year}-${month}-${day}`;

  const handleSubmit = async () => {
    if (!selectedDate) {
      alert('Please select a dispatch date');
      return;
    }
    setLoading(true);
    try {
      await onSchedule(selectedDate, notes);
      onClose();
    } catch (error) {
      console.error('Error scheduling dispatch:', error);
      alert('Failed to schedule dispatch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, color: '#1a1a1a', fontSize: '18px', fontWeight: '600' }}>
          Schedule Dispatch
        </h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Select a date when the body will be transported
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
            Dispatch Date *
          </label>
          <input
            type="date"
            value={selectedDate}
            min={minDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details (e.g., family contact, specific instructions)"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              height: '80px',
              resize: 'vertical',
              marginTop: '4px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <CloseBtn onClick={onClose}>Cancel</CloseBtn>
          <ScheduleBtn onClick={handleSubmit} $disabled={!selectedDate || loading}>
            {loading ? 'Scheduling...' : 'Schedule Dispatch'}
          </ScheduleBtn>
        </div>
      </ModalContent>
    </Overlay>
  );
};

export default ScheduleDispatchModal;
