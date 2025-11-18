import { useEffect, useMemo, useState } from 'react';
import { adminApi, coursesApi, relationsApi } from '../api/apiService';
import type { Course, Topic, User, Group } from '../types';
import { useToast } from '../components/ToastProvider';

const AdminCoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const { notify } = useToast();

  // Нові стейти для привʼязаних
  const [attachedGroups, setAttachedGroups] = useState<Group[]>([]);
  const [attachedTeachers, setAttachedTeachers] = useState<User[]>([]);

  const load = async () => {
    try {
      const [crs, us, gr] = await Promise.all([
        adminApi.getCourses(),
        adminApi.getUsers(),
        adminApi.getGroups(),
      ]);
      setCourses(crs.data);
      setUsers(us.data);
      setGroups(gr.data);
      if(!selectedCourseId && crs.data.length) setSelectedCourseId(crs.data[0].id);
    } catch(e){
      console.error(e);
      notify('Не вдалося завантажити дані', 'error');
    }
  };

  // Завантаження привʼязаних груп/викладачів
  const loadRelations = async () => {
    if(!selectedCourseId) { setAttachedGroups([]); setAttachedTeachers([]); return; }
    try {
      const [grRes, tRes] = await Promise.all([
        relationsApi.getCourseGroups(selectedCourseId),
        relationsApi.getCourseTeachers(selectedCourseId)
      ]);
      setAttachedGroups(grRes.data);
      setAttachedTeachers(tRes.data);
    } catch(e){
      setAttachedGroups([]); setAttachedTeachers([]);
      notify('Не вдалося завантажити привʼязки', 'error');
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadRelations(); }, [selectedCourseId]);

  useEffect(() => {
    const fetchTopics = async () => {
      if(!selectedCourseId) { setTopics([]); return; }
      try {
        const res = await coursesApi.getTopics(selectedCourseId);
        setTopics(res.data);
      } catch(e) {
        console.error(e);
      }
    }
    fetchTopics();
  }, [selectedCourseId]);

  const selectedCourse = useMemo(() => courses.find(c => c.id === selectedCourseId) || null, [courses, selectedCourseId]);

  const [teacherId, setTeacherId] = useState('');
  const [groupId, setGroupId] = useState('');

  // Фільтруємо вже привʼязаних
  const teacherOptions = users.filter(u => u.role === 'TEACHER' && !attachedTeachers.some(a => a.id === u.id));
  const groupOptions = groups.filter(g => !attachedGroups.some(a => a.id === g.id));

  const assignTeacher = async () => {
    if(!selectedCourseId || !teacherId) return;
    try {
      await adminApi.bindTeacherToCourse(Number(teacherId), selectedCourseId);
      notify('Викладача призначено', 'success');
      setTeacherId('');
      loadRelations();
    } catch(e: any) {
      if(e?.response?.status === 409) notify('Викладач вже привʼязаний', 'warning');
      else notify('Помилка призначення', 'error');
    }
  };

  const assignGroup = async () => {
    if(!selectedCourseId || !groupId) return;
    try {
      await adminApi.bindCourseToGroup(selectedCourseId, Number(groupId));
      notify('Групу додано до курсу', 'success');
      setGroupId('');
      loadRelations();
    } catch(e: any) {
      if(e?.response?.status === 409) notify('Група вже привʼязана', 'warning');
      else notify('Помилка додавання групи', 'error');
    }
  };

  // Відвʼязати групу/викладача
  const unbindGroup = async (groupId: number) => {
    if(!selectedCourseId) return;
    try {
      await relationsApi.unbindCourseFromGroup(selectedCourseId, groupId);
      notify('Групу відвʼязано', 'success');
      loadRelations();
    } catch(e){
      notify('Помилка відвʼязування групи', 'error');
    }
  };
  const unbindTeacher = async (teacherId: number) => {
    if(!selectedCourseId) return;
    try {
      await relationsApi.unbindTeacherFromCourse(teacherId, selectedCourseId);
      notify('Викладача відвʼязано', 'success');
      loadRelations();
    } catch(e){
      notify('Помилка відвʼязування викладача', 'error');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Керування курсами</h1>
      </header>
      <div className="dashboard-content" style={{gridTemplateColumns:'320px 1fr'}}>
        <section className="card">
          <h3>Курси</h3>
          <ul>
            {courses.map(c => (
              <li key={c.id}>
                <button className="btn-secondary btn-small" onClick={() => setSelectedCourseId(c.id)} style={{width:'100%', justifyContent:'flex-start'}}>
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="card" style={{minHeight:'420px'}}>
          {selectedCourse ? (
            <div className="fade-in">
              <h3>Курс: {selectedCourse.name}</h3>

              <div className="admin-actions" style={{marginTop:'1rem'}}>
                <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
                  <label>Призначити викладача</label>
                  <select className="form-control-select" value={teacherId} onChange={e => setTeacherId(e.target.value)}>
                    <option value="">Оберіть викладача</option>
                    {teacherOptions.map(t => <option key={t.id} value={t.id}>{t.fio || t.username}</option>)}
                  </select>
                  <button className="btn-primary" style={{width:'auto'}} onClick={assignTeacher}>Призначити</button>
                </div>
                <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
                  <label>Додати групу</label>
                  <select className="form-control-select" value={groupId} onChange={e => setGroupId(e.target.value)}>
                    <option value="">Оберіть групу</option>
                    {groupOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <button className="btn-primary" style={{width:'auto'}} onClick={assignGroup}>Додати</button>
                </div>
              </div>

              <h4 className="mt-md">Привʼязані викладачі</h4>
              <ul>
                {attachedTeachers.length > 0 ? attachedTeachers.map(t => (
                  <li key={t.id} style={{display:'flex', alignItems:'center', gap:8}}>
                    <span>{t.fio || t.username}</span>
                    <button className="btn-danger btn-small" style={{width:'auto'}} onClick={() => unbindTeacher(t.id)}>Відвʼязати</button>
                  </li>
                )) : <li style={{color:'var(--text-muted)'}}>Немає викладачів.</li>}
              </ul>

              <h4 className="mt-md">Привʼязані групи</h4>
              <ul>
                {attachedGroups.length > 0 ? attachedGroups.map(g => (
                  <li key={g.id} style={{display:'flex', alignItems:'center', gap:8}}>
                    <span>{g.name}</span>
                    <button className="btn-danger btn-small" style={{width:'auto'}} onClick={() => unbindGroup(g.id)}>Відвʼязати</button>
                  </li>
                )) : <li style={{color:'var(--text-muted)'}}>Немає груп.</li>}
              </ul>

              <h4 className="mt-md">Теми курсу</h4>
              <ul>
                {topics.map(t => <li key={t.id}>{t.name}</li>)}
                {!topics.length && <li style={{color:'var(--text-muted)'}}>Немає тем.</li>}
              </ul>
            </div>
          ) : (
            <p>Оберіть курс для керування.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminCoursesPage;
