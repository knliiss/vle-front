import { useEffect, useMemo, useState } from 'react';
import type { User, Group } from '../types';
import { adminApi, usersApi } from '../api/apiService';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';
import BindUserToGroupModal from '../components/BindUserToGroupModal';
import EditTeacherProfileModal from '../components/EditTeacherProfileModal';
import { useAuth } from '../context/AuthContext';

const rolesOrder: Array<User['role']> = ['ADMINISTRATOR','TEACHER','STUDENT'];

const AdminUsersPage = () => {
  const { notify } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeRole, setActiveRole] = useState<User['role']>('ADMINISTRATOR');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'username'|'fio'|'group'|'academicTitle'|'department'|'workPhone'|'scientificDegree'>('username');
  const [sortAsc, setSortAsc] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [bindModalOpen, setBindModalOpen] = useState(false);
  const [userToBind, setUserToBind] = useState<User | null>(null);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<User | null>(null);

  const [extendedTeachers, setExtendedTeachers] = useState<Record<number, any>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const stats = useMemo(() => {
    const admins = users.filter(u => u.role==='ADMINISTRATOR').length;
    const teachers = users.filter(u => u.role==='TEACHER').length;
    const students = users.filter(u => u.role==='STUDENT').length;
    const studentsNoGroup = users.filter(u => u.role==='STUDENT' && !u.groupId).length;
    const studentsWithGroup = students - studentsNoGroup;
    return { admins, teachers, students, studentsNoGroup, studentsWithGroup };
  }, [users]);

  const load = async () => {
    try {
      const [uRes, gRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getGroups(),
      ]);
      setUsers(uRes.data);
      setGroups(gRes.data);
      const teacherIds = uRes.data.filter((u: User) => u.role === 'TEACHER').map(u => u.id);
      const extended: Record<number, any> = {};
      await Promise.all(teacherIds.map(async id => {
        try {
          const ext = await usersApi.getExtendedById(id);
          extended[id] = ext.data;
        } catch {}
      }));
      setExtendedTeachers(extended);
    } catch(e){
      console.error(e);
      notify('Не вдалося завантажити користувачів', 'error');
    }
  };

  useEffect(() => { load(); }, []);

  const getGroupName = (user: User) => user.groupId ? (groups.find(g => g.id === user.groupId)?.name || '') : '';
  const getSortValue = (user: User, key: typeof sortKey) => {
    if (key === 'group') return getGroupName(user);
    if (key === 'academicTitle' || key === 'department' || key === 'workPhone' || key === 'scientificDegree') {
      const ext = extendedTeachers[user.id];
      return (ext && ext[key]) ? String(ext[key]) : '';
    }
    return (user as any)[key] ? String((user as any)[key]) : '';
  };

  const filteredUsers = useMemo(() => {
    const base = users.filter(u => u.role === activeRole);
    const query = search.trim().toLowerCase();
    const searched = query ? base.filter(u => {
      const ext = extendedTeachers[u.id] || {};
      const haystack = [u.username, u.fio, getGroupName(u), ext.academicTitle, ext.department, ext.workPhone, ext.scientificDegree]
        .filter(Boolean)
        .map(String)
        .join(' ') // конкатенація
        .toLowerCase();
      return haystack.includes(query);
    }) : base;
    const sorted = [...searched].sort((a,b) => {
      const va = getSortValue(a, sortKey).toLowerCase();
      const vb = getSortValue(b, sortKey).toLowerCase();
      if (va === vb) return 0;
      return sortAsc ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });
    return sorted;
  }, [users, activeRole, search, sortKey, sortAsc, groups, extendedTeachers]);


  const askDelete = (u: User) => {
    if (u.id === currentUser?.id) return;
    setUserToDelete(u);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if(!userToDelete) return;
    try {
      await adminApi.deleteUser(userToDelete.id);
      notify('Користувача видалено', 'success');
      setConfirmOpen(false);
      setUserToDelete(null);
      load();
    } catch(e){
      console.error(e);
      notify('Не вдалося видалити користувача', 'error');
    }
  };

  const openBindGroup = (user: User) => {
    setUserToBind(user);
    setBindModalOpen(true);
  };

  const openEditProfile = (teacher: User) => {
    setTeacherToEdit(teacher);
    setEditProfileOpen(true);
  };

  const exportCsv = () => {
    const headers = ['id','username','fio','role','group','academicTitle','department','workPhone','scientificDegree'];
    const rows = users.map(u => {
      const ext = extendedTeachers[u.id] || {};
      return [
        u.id,
        u.username || '',
        u.fio || '',
        u.role,
        getGroupName(u) || '',
        ext.academicTitle || '',
        ext.department || '',
        ext.workPhone || '',
        ext.scientificDegree || ''
      ].map(val => `"${String(val).replace(/"/g,'""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleRowSelect = (id: number) => {
    setSelectedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id); else copy.add(id);
      return copy;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());
  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredUsers.filter(u => u.id !== currentUser?.id).map(u => u.id)));
  };

  const toggleSortHeader = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(v => !v); else { setSortKey(key); setSortAsc(true); }
  };

  const exportSelectedCsv = () => {
    if (!selectedIds.size) return;
    const headers = ['id','username','fio','role','group','academicTitle','department','workPhone','scientificDegree'];
    const rows = users.filter(u => selectedIds.has(u.id)).map(u => {
      const ext = extendedTeachers[u.id] || {};
      return [u.id,u.username||'',u.fio||'',u.role,getGroupName(u)||'',ext.academicTitle||'',ext.department||'',ext.workPhone||'',ext.scientificDegree||'']
        .map(val => `"${String(val).replace(/"/g,'""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='users_selected_export.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const bulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds).filter(id => id !== currentUser?.id);
    try {
      await Promise.all(idsToDelete.map(id => adminApi.deleteUser(id)));
      notify(`Видалено ${idsToDelete.length} користувачів`, 'success');
      setBulkConfirmOpen(false);
      clearSelection();
      load();
    } catch(e){
      console.error(e);
      notify('Помилка масового видалення', 'error');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Користувачі</h1>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => {setConfirmOpen(false); setUserToDelete(null);} }
        onConfirm={handleDelete}
        title="Підтвердити видалення"
        message={userToDelete ? `Видалити користувача ${userToDelete.username}?` : ''}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        onCancel={() => setBulkConfirmOpen(false)}
        onConfirm={bulkDelete}
        title="Підтвердити масове видалення"
        message={`Видалити вибраних користувачів (${selectedIds.size})? Ваш обліковий запис не буде видалено.`}
      />

      <BindUserToGroupModal
        show={bindModalOpen}
        onClose={() => {setBindModalOpen(false); setUserToBind(null); load();}}
        user={userToBind}
      />

      <EditTeacherProfileModal
        show={editProfileOpen}
        teacher={teacherToEdit}
        onClose={() => {setEditProfileOpen(false); setTeacherToEdit(null); load();}}
      />

      <div className="card" style={{marginBottom:'1.5rem'}}>
        <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
          {rolesOrder.map(role => (
            <button
              key={role}
              className={role === activeRole ? 'btn-primary' : 'btn-secondary'}
              style={{width:'auto'}}
              onClick={() => setActiveRole(role)}
            >
              {role === 'ADMINISTRATOR' && 'Адміністратори'}
              {role === 'TEACHER' && 'Викладачі'}
              {role === 'STUDENT' && 'Студенти'}
            </button>
          ))}
        </div>
        <div className="users-tools" style={{marginTop:'1rem', display:'flex', flexWrap:'wrap', gap:'0.75rem'}}>
          <input
            placeholder="Пошук (логін, ПІБ, група, профіль)..."
            value={search}
            onChange={e=>setSearch(e.target.value)}
            style={{flex:'1 1 240px'}}
          />
          <button className="btn-secondary" style={{width:'auto'}} disabled={!search} onClick={()=>setSearch('')}>Очистити пошук</button>
          <select value={sortKey} onChange={e=>setSortKey(e.target.value as any)} style={{flex:'0 0 180px'}}>
            <option value="username">Логін</option>
            <option value="fio">ПІБ</option>
            {activeRole==='STUDENT' && <option value="group">Група</option>}
            {activeRole==='TEACHER' && <>
              <option value="academicTitle">Вчене звання</option>
              <option value="department">Кафедра</option>
              <option value="workPhone">Телефон</option>
              <option value="scientificDegree">Науковий ступінь</option>
            </>}
          </select>
          <button className="btn-secondary" style={{width:'auto'}} onClick={()=>setSortAsc(a=>!a)}>
            Напрям: {sortAsc?'↑ ASC':'↓ DESC'}
          </button>
          <button className="btn-secondary" style={{width:'auto'}} onClick={exportCsv}>Експорт CSV</button>
          <button className="btn-secondary" style={{width:'auto'}} disabled={!selectedIds.size} onClick={exportSelectedCsv}>Експорт вибраних</button>
          <button className="btn-danger" style={{width:'auto'}} disabled={!selectedIds.size} onClick={()=>setBulkConfirmOpen(true)}>Видалити вибраних</button>
          <button className="btn-secondary" style={{width:'auto'}} onClick={selectAllFiltered}>Вибрати всі</button>
          <button className="btn-secondary" style={{width:'auto'}} onClick={clearSelection} disabled={!selectedIds.size}>Очистити вибір</button>
        </div>
        <div style={{marginTop:'1rem', display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))'}}>
          <div className="stat-tile">
            <strong>{stats.admins}</strong>
            <span>Адміністраторів</span>
          </div>
            <div className="stat-tile">
            <strong>{stats.teachers}</strong>
            <span>Викладачів</span>
          </div>
          <div className="stat-tile">
            <strong>{stats.students}</strong>
            <span>Студентів</span>
          </div>
          <div className="stat-tile">
            <strong>{stats.studentsWithGroup}</strong>
            <span>З групою</span>
          </div>
          <div className="stat-tile">
            <strong>{stats.studentsNoGroup}</strong>
            <span>Без групи</span>
          </div>
        </div>
        <div className="stats-charts" style={{marginTop:'1rem', display:'flex', flexWrap:'wrap', gap:'1.25rem'}}>
          {/* Розподіл ролей */}
          <div className="chart-card">
            <h4>Ролі</h4>
            {(() => {
              const total = stats.admins + stats.teachers + stats.students || 1;
              const aPct = (stats.admins/total)*100;
              const tPct = (stats.teachers/total)*100;
              const sPct = (stats.students/total)*100;
              return (
                <div className="bar-chart" aria-label="Розподіл ролей">
                  <div className="bar-segment" style={{flex:aPct, background:'var(--primary-light)'}} title={`Адміністратори ${stats.admins}`}></div>
                  <div className="bar-segment" style={{flex:tPct, background:'var(--primary)'}} title={`Викладачі ${stats.teachers}`}></div>
                  <div className="bar-segment" style={{flex:sPct, background:'var(--text-secondary)'}} title={`Студенти ${stats.students}`}></div>
                </div>
              );
            })()}
            <div className="chart-legend">
              <span><span className="legend-color" style={{background:'var(--primary-light)'}}></span>Адм.</span>
              <span><span className="legend-color" style={{background:'var(--primary)'}}></span>Викл.</span>
              <span><span className="legend-color" style={{background:'var(--text-secondary)'}}></span>Студ.</span>
            </div>
          </div>
          {/* Студенти (група / без) */}
          <div className="chart-card">
            <h4>Студенти / Групи</h4>
            {(() => {
              const total = stats.students || 1;
              const withPct = (stats.studentsWithGroup/total)*100;
              const noPct = (stats.studentsNoGroup/total)*100;
              return (
                <div className="bar-chart" aria-label="Студенти за належністю до груп">
                  <div className="bar-segment" style={{flex:withPct, background:'var(--primary)'}} title={`З групою ${stats.studentsWithGroup}`}></div>
                  <div className="bar-segment" style={{flex:noPct, background:'var(--error-bg)', border:'1px solid var(--error)'}} title={`Без групи ${stats.studentsNoGroup}`}></div>
                </div>
              );
            })()}
            <div className="chart-legend">
              <span><span className="legend-color" style={{background:'var(--primary)'}}></span>З групою</span>
              <span><span className="legend-color" style={{background:'var(--error-bg)', border:'1px solid var(--error)'}}></span>Без групи</span>
            </div>
          </div>
        </div>
      </div>

      <section className="card">
        <h3>
          {activeRole === 'ADMINISTRATOR' && 'Адміністратори'}
          {activeRole === 'TEACHER' && 'Викладачі'}
          {activeRole === 'STUDENT' && 'Студенти'}
        </h3>
        <div style={{overflowX:'auto'}}>
          <table className="table users-table-sticky" style={{borderSpacing: '0 6px'}}>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" aria-label="Select all" onChange={e=> e.target.checked ? selectAllFiltered() : clearSelection()} checked={filteredUsers.length>0 && filteredUsers.every(u=> selectedIds.has(u.id) || u.id===currentUser?.id)} />
                </th>
                <th>
                  <button className="table-sort-btn" onClick={()=>toggleSortHeader('username')}>Логін {sortKey==='username' ? (sortAsc?'↑':'↓'):''}</button>
                </th>
                <th>
                  <button className="table-sort-btn" onClick={()=>toggleSortHeader('fio')}>ПІБ {sortKey==='fio' ? (sortAsc?'↑':'↓'):''}</button>
                </th>
                {activeRole === 'STUDENT' && (
                  <th>
                    <button className="table-sort-btn" onClick={()=>toggleSortHeader('group')}>Група {sortKey==='group' ? (sortAsc?'↑':'↓'):''}</button>
                  </th>
                )}
                {activeRole === 'TEACHER' && <>
                  <th><button className="table-sort-btn" onClick={()=>toggleSortHeader('academicTitle')}>Вчене звання {sortKey==='academicTitle' ? (sortAsc?'↑':'↓'):''}</button></th>
                  <th><button className="table-sort-btn" onClick={()=>toggleSortHeader('department')}>Кафедра {sortKey==='department' ? (sortAsc?'↑':'↓'):''}</button></th>
                  <th><button className="table-sort-btn" onClick={()=>toggleSortHeader('workPhone')}>Телефон {sortKey==='workPhone' ? (sortAsc?'↑':'↓'):''}</button></th>
                  <th><button className="table-sort-btn" onClick={()=>toggleSortHeader('scientificDegree')}>Науковий ступінь {sortKey==='scientificDegree' ? (sortAsc?'↑':'↓'):''}</button></th>
                </>}
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const ext = extendedTeachers[u.id];
                return (
                <tr key={u.id} style={{background:'var(--bg-surface)'}} className={selectedIds.has(u.id) ? 'user-row-selected' : ''}>
                  <td style={{padding:'10px 12px'}}>
                    {u.id !== currentUser?.id && (
                      <input type="checkbox" checked={selectedIds.has(u.id)} onChange={()=>toggleRowSelect(u.id)} aria-label={`Select user ${u.username}`} />
                    )}
                  </td>
                  <td style={{padding:'10px 12px'}}>{u.username}</td>
                  <td style={{padding:'10px 12px'}}>{u.fio || '—'}</td>
                  {activeRole === 'STUDENT' && <td style={{padding:'10px 12px'}}>{getGroupName(u) || '—'}</td>}
                  {activeRole === 'TEACHER' && <>
                    <td style={{padding:'10px 12px'}}>{ext?.academicTitle || '—'}</td>
                    <td style={{padding:'10px 12px'}}>{ext?.department || '—'}</td>
                    <td style={{padding:'10px 12px'}}>{ext?.workPhone || '—'}</td>
                    <td style={{padding:'10px 12px'}}>{ext?.scientificDegree || '—'}</td>
                  </>}
                  <td style={{padding:'10px 12px'}}>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      {u.role === 'STUDENT' && (
                        <button className="btn-secondary btn-small" style={{width:'auto'}} onClick={() => openBindGroup(u)}>
                          Група
                        </button>
                      )}
                      {u.role === 'TEACHER' && (
                        <button className="btn-secondary btn-small" style={{width:'auto'}} onClick={() => openEditProfile(u)}>
                          Редагувати профіль
                        </button>
                      )}
                      {u.id !== currentUser?.id && (
                        <button
                          className="btn-danger btn-small"
                          style={{width:'auto'}}
                          onClick={() => askDelete(u)}
                        >
                          Видалити
                        </button>
                      )}
                    </div>
                  </td>
                </tr>);
              })}
              {!filteredUsers.length && (
                <tr>
                  <td colSpan={activeRole === 'TEACHER' ? 7 : (activeRole === 'STUDENT'?4:3)} style={{textAlign:'center', color:'var(--text-muted)', padding:'14px'}}>
                    Немає користувачів цієї ролі.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminUsersPage;
