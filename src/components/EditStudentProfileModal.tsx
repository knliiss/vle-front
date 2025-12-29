import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import { usersApi, adminApi, profilesApi } from '../api/apiService';
import type { User, Group } from '../types';
import { useToast } from './ToastProvider';

interface Props {
  show: boolean;
  user: User | null;
  onClose: () => void;
  onSaved?: () => void;
}

const EditStudentProfileModal: React.FC<Props> = ({ show, user, onClose, onSaved }) => {
  const { notify } = useToast();
  const [fio, setFio] = useState('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setFio(user?.fio || '');
    setGroupId(user?.groupId ?? '');
    adminApi.getGroups().then(res => setGroups(res.data)).catch(() => {});
  }, [show, user]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      // update fio via usersApi
      await usersApi.patch(user.id, { fio: fio || undefined });
      // update group if changed
      if (groupId !== (user.groupId ?? '')) {
        await profilesApi.patchStudentProfile(user.id, { groupId: groupId === '' ? undefined : Number(groupId) });
      }
      notify('Профіль збережено', 'success');
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Failed to save student profile', err);
      notify('Не вдалося зберегти профіль', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !user) return null;

  return (
    <Modal title={`Редагувати профіль: ${user.username}`} show={show} onClose={onClose}>
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label>ПІБ</label>
          <input value={fio} onChange={e => setFio(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Група</label>
          <select value={groupId} onChange={e => setGroupId(e.target.value === '' ? '' : Number(e.target.value))} className="form-control-select">
            <option value="">(без групи)</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
          <button type="button" className="btn-secondary" onClick={onClose}>Скасувати</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Збереження...' : 'Зберегти'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default EditStudentProfileModal;

