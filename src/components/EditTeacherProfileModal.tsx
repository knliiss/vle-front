import { useEffect, useState } from 'react';
import type { TeacherProfileUpdateRequest } from '../types';
import { profilesApi, usersApi } from '../api/apiService';
import Modal from './Modal';
import { useToast } from './ToastProvider';

interface Props {
  show: boolean;
  teacher: { id: number } | null;
  onClose: () => void;
}

const EditTeacherProfileModal = ({ show, teacher, onClose }: Props) => {
  const { notify } = useToast();
  const [form, setForm] = useState<TeacherProfileUpdateRequest>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && teacher) {
      usersApi.getExtendedById(teacher.id)
        .then(res => {
          setForm({
            academicTitle: res.data.academicTitle || '',
            department: res.data.department || '',
            workPhone: res.data.workPhone || '',
            scientificDegree: res.data.scientificDegree || '',
          });
        })
        .catch(() => setError('Не вдалося завантажити профіль викладача'));
    }
  }, [show, teacher]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    setLoading(true);
    setError('');
    try {
      await profilesApi.patchTeacherProfile(teacher.id, form);
      notify('Профіль викладача оновлено', 'success');
      onClose();
    } catch {
      setError('Не вдалося оновити профіль');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !teacher) return null;

  return (
    <Modal title="Редагувати профіль викладача" show={show} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label>Вчене звання</label>
          <input name="academicTitle" value={form.academicTitle || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Кафедра</label>
          <input name="department" value={form.department || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Робочий телефон</label>
          <input name="workPhone" value={form.workPhone || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Науковий ступінь</label>
          <input name="scientificDegree" value={form.scientificDegree || ''} onChange={handleChange} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>Зберегти</button>
      </form>
    </Modal>
  );
};

export default EditTeacherProfileModal;
