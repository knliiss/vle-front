import React, { useState } from 'react';
import Modal from './Modal';
import { adminApi } from '../api/apiService';
import { useToast } from './ToastProvider';

interface Props {
  show: boolean;
  onClose: () => void;
  topicId: number;
  onTaskCreated: () => void;
}

const CreateTestTaskModal: React.FC<Props> = ({ show, onClose, topicId, onTaskCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMark, setMaxMark] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const { notify } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { notify('Вкажіть назву тесту', 'warning'); return; }
    setLoading(true);
    try {
      await adminApi.createTask({ name, description: description || name, topicId, maxMark, taskType: 'TEST' });
      notify('Тест створено. Тепер додайте питання на сторінці завдання.', 'success');
      onTaskCreated();
      onClose();
      setName(''); setDescription(''); setMaxMark(100);
    } catch (err) {
      console.error(err);
      notify('Не вдалося створити тест', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Нове тестове завдання" show={show} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Назва тесту</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Опис (необов'язково)</label>
          <input value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Макс. бал</label>
          <input type="number" value={maxMark} onChange={e => setMaxMark(Number(e.target.value || 0))} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Створення...' : 'Створити тест'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTestTaskModal;
