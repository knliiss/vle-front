import { useEffect, useMemo, useState } from 'react';
import { adminApi, relationsApi } from '../api/apiService';
import type { Group, User, Course } from '../types';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminGroupsPage = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<'username'|'fio'|'role'>('username');
  const [sortAsc, setSortAsc] = useState(true);
  const { notify } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('Підтвердити видалення');
  const [confirmMessage, setConfirmMessage] = useState('Ви впевнені?');
  const [pendingDelete, setPendingDelete] = useState<{ id: number } | null>(null);

  const openDeleteConfirm = (groupId: number, name?: string) => {
    setPendingDelete({ id: groupId });
    setConfirmTitle('Видалити групу');
    setConfirmMessage(`Видалити групу "${name ?? ''}"? Ця дія незворотна.`);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) { setConfirmOpen(false); return; }
    try {
      await adminApi.deleteGroup(pendingDelete.id);
      notify('Групу видалено', 'success');
      await load();
      if (selectedGroupId === pendingDelete.id) setSelectedGroupId(null);
    } catch (err) {
      console.error('Failed to delete group', err);
      notify('Не вдалося видалити групу', 'error');
    } finally {
      setPendingDelete(null);
      setConfirmOpen(false);
    }
  };

  const [attachedCourses, setAttachedCourses] = useState<Course[]>([]);

  const load = async () => {
    try {
      const [gr, us, cs] = await Promise.all([
        adminApi.getGroups(),
        adminApi.getUsers(),
        adminApi.getCourses(),
      ]);
      setGroups(gr.data);
      setUsers(us.data);
      setCourses(cs.data);
      if(!selectedGroupId && gr.data.length) setSelectedGroupId(gr.data[0].id);
    } catch (e) {
      console.error(e);
      notify('Не вдалося завантажити дані', 'error');
    }
  };

  const loadRelations = async () => {
    if(!selectedGroupId) { setAttachedCourses([]); return; }
    try {
      const res = await relationsApi.getGroupCourses(selectedGroupId);
      setAttachedCourses(res.data);
    } catch(e){
      setAttachedCourses([]);
      notify('Не вдалося завантажити курси групи', 'error');
    }
  };

  const deleteGroup = (groupId: number, name?: string) => openDeleteConfirm(groupId, name);

  useEffect(() => { load(); }, []);
  useEffect(() => { loadRelations(); }, [selectedGroupId]);

  const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId) || null, [groups, selectedGroupId]);
  const members = useMemo(() => {
    const base = users.filter(u => u.groupId === selectedGroupId && u.role === 'STUDENT');
    const sorted = [...base].sort((a,b) => {
      const va = (a as any)[sortKey] || '';
      const vb = (b as any)[sortKey] || '';
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return sorted;
  }, [users, selectedGroupId, sortKey, sortAsc]);

  const studentsWithoutGroup = useMemo(
    () => users.filter(u => u.role === 'STUDENT' && !u.groupId),
    [users]
  );

  const toggleSort = (key: 'username'|'fio'|'role') => {
    if (sortKey === key) setSortAsc(a => !a); else { setSortKey(key); setSortAsc(true); }
  };

  const courseOptions = courses.filter(c => !attachedCourses.some(a => a.id === c.id));

  const [bindCourseId, setBindCourseId] = useState('');
  const handleBindCourse = async () => {
    if(!selectedGroupId || !bindCourseId) return;
    try {
      await adminApi.bindCourseToGroup(Number(bindCourseId), selectedGroupId);
      notify('Групу додано до курсу', 'success');
      setBindCourseId('');
      loadRelations();
    } catch(e: any){
      if(e?.response?.status === 409) notify('Курс вже привʼязаний', 'warning');
      else notify('Помилка привʼязки групи', 'error');
    }
  };

  const unbindCourse = async (courseId: number) => {
    if(!selectedGroupId) return;
    try {
      await relationsApi.unbindCourseFromGroup(courseId, selectedGroupId);
      notify('Курс відвʼязано', 'success');
      loadRelations();
    } catch(e){
      notify('Помилка відвʼязування курсу', 'error');
    }
  };

  return (
    <div className="dashboard-container">
      <ConfirmDialog open={confirmOpen} title={confirmTitle} message={confirmMessage} onConfirm={handleConfirmDelete} onCancel={() => { setConfirmOpen(false); setPendingDelete(null); }} />
      <header className="dashboard-header">
        <h1>Керування групами</h1>
      </header>
      <div className="dashboard-content" style={{gridTemplateColumns:'320px 1fr'}}>
        <section className="card">
          <h3>Групи</h3>
          <ul>
            {groups.map(g => (
              <li key={g.id}>
                <button className={`btn-secondary btn-small`} onClick={() => setSelectedGroupId(g.id)} style={{width:'100%', justifyContent:'flex-start'}}>
                  {g.name}
                </button>
                <button className="btn-danger btn-small" style={{marginLeft:8, width:'auto'}} onClick={() => deleteGroup(g.id, g.name)}>Видалити</button>
              </li>
            ))}
          </ul>
        </section>
        <section className="card" style={{minHeight: '420px'}}>
          {selectedGroup ? (
            <div className="fade-in">
              <h3>Група: {selectedGroup.name}</h3>
              <div className="admin-actions" style={{marginTop: '1rem'}}>
                <div style={{display:'flex', gap:12, alignItems:'center'}}>
                  <label>Додати курс для групи</label>
                  <select className="form-control-select" value={bindCourseId} onChange={e => setBindCourseId(e.target.value)}>
                    <option value="">Оберіть курс</option>
                    {courseOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button className="btn-primary" style={{width:'auto'}} onClick={handleBindCourse}>Привʼязати</button>
                </div>
              </div>

              <h4 className="mt-md">Студенти групи</h4>
              <div style={{overflowX:'auto'}}>
                <table className="table">
                  <thead>
                    <tr>
                      <th><button className="btn-secondary btn-small" onClick={() => toggleSort('username')}>Логін {sortKey==='username'?(sortAsc?'↑':'↓'):''}</button></th>
                      <th><button className="btn-secondary btn-small" onClick={() => toggleSort('fio')}>ПІБ {sortKey==='fio'?(sortAsc?'↑':'↓'):''}</button></th>
                      <th>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id}>
                        <td>{m.username}</td>
                        <td>{m.fio || '-'}</td>
                        <td>
                          <button
                            className="btn-danger btn-small"
                            style={{width:'auto'}}
                            onClick={async () => {
                              try {
                                await adminApi.unbindUserFromGroup(m.id, selectedGroupId!);
                                notify('Студента відвʼязано від групи', 'success');
                                load();
                              } catch(e){
                                notify('Помилка відвʼязування студента', 'error');
                              }
                            }}
                          >
                            Відвʼязати
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!members.length && (
                      <tr><td colSpan={3} style={{textAlign:'center', color:'var(--text-muted)'}}>Немає студентів у групі</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h4 className="mt-md">Студенти без групи</h4>
              <div style={{overflowX:'auto'}}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Логін</th>
                      <th>ПІБ</th>
                      <th>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsWithoutGroup.map(s => (
                      <tr key={s.id}>
                        <td>{s.username}</td>
                        <td>{s.fio || '-'}</td>
                        <td>
                          <button
                            className="btn-secondary btn-small"
                            style={{width:'auto'}}
                            onClick={async () => {
                              try {
                                await adminApi.bindUserToGroup(s.id, selectedGroupId!);
                                notify('Студента додано до групи', 'success');
                                load();
                              } catch(e){
                                notify('Помилка додавання студента', 'error');
                              }
                            }}
                          >
                            Додати в групу
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!studentsWithoutGroup.length && (
                      <tr><td colSpan={3} style={{textAlign:'center', color:'var(--text-muted)'}}>Немає студентів без групи</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <h4 className="mt-md">Курси групи</h4>
              <ul>
                {attachedCourses.length > 0 ? attachedCourses.map(c => (
                  <li key={c.id} style={{display:'flex', alignItems:'center', gap:8}}>
                    <span>{c.name}</span>
                    <button className="btn-danger btn-small" style={{width:'auto'}} onClick={() => unbindCourse(c.id)}>Відвʼязати</button>
                  </li>
                )) : <li style={{color:'var(--text-muted)'}}>Немає курсів.</li>}
              </ul>
            </div>
          ) : (
            <p>Оберіть групу для перегляду.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminGroupsPage;

