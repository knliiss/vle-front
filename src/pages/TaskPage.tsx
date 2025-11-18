import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/ToastProvider";
import { commonApi, studentApi, teacherApi, testQuestionsApi, submissionsApi, relationsApi } from "../api/apiService";
import type { Task, Submission, TestQuestion, User, Group } from "../types";
import TestRunner from "../components/TestRunner";
import TestEditor from "../components/TestEditor";
import { useDeoverlay } from "../hooks/useDeoverlay";
import ErrorBoundary from "../components/ErrorBoundary";

const TaskPage: React.FC = () => {
  useDeoverlay();

  const { taskId } = useParams<{ taskId: string }>();
  const numericTaskId = useMemo(() => Number(taskId), [taskId]);
  const { user } = useAuth();
  const { notify } = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [mySubs, setMySubs] = useState<Submission[]>([]);
  const [allSubs, setAllSubs] = useState<Submission[]>([]);
  const [studentsForSelect, setStudentsForSelect] = useState<User[]>([] as any);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [submissionsHint, setSubmissionsHint] = useState<string>("Оберіть студента щоб побачити роботи");
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);
  const [studentsError, setStudentsError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [courseGroups, setCourseGroups] = useState<Group[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [answersModal, setAnswersModal] = useState<{ open: boolean; submission: Submission | null }>(() => ({ open: false, submission: null }));
  const debugSubsEnabled = useMemo(() => new URLSearchParams(window.location.search).get('debugSubs') === '1', []);

  const isTest = task?.taskType === "TEST";
  const safeMySubs: Submission[] = Array.isArray(mySubs) ? mySubs : (mySubs ? [mySubs] : []);
  const locked = user?.role === "STUDENT" && isTest && safeMySubs.some(s => !!s.content);

  const fetchAll = async () => {
    if (!numericTaskId) return;
    setLoading(true);
    setError("");
    try {
      const taskRes = await commonApi.getTaskById(numericTaskId);
      const t = taskRes.data;
      setTask(t);
      try {
        const topicRes = await commonApi.getTopicById(t.topicId);
        const cid = topicRes.data.courseId;
        setCourseId(cid);
      } catch (e) { setCourseId(null); }
      if (t.taskType === 'TEST') {
        try {
          const qRes = await testQuestionsApi.listByTask(t.id);
          setQuestions(qRes.data.sort((a:any,b:any)=>(a.order||0)-(b.order||0)));
        } catch (e) { setQuestions([]); }
      } else { setQuestions([]); }
      if (user?.role === 'STUDENT') {
        try {
          const subs = await studentApi.getMySubmissionsForTask(numericTaskId);
          const data = subs.data;
          setMySubs(Array.isArray(data) ? data : (data ? [data] : []));
        } catch (e) { setMySubs([]); }
      } else if (user && (user.role === 'TEACHER' || user.role === 'ADMINISTRATOR')) {
        // teacher/admin specific: no student retrieval here; handled by effect once courseId ready
        if (!selectedUserId) {
          setAllSubs([]);
          setSubmissionsHint('Оберіть студента щоб побачити роботи');
        }
      }
    } catch (e) { setError('Не вдалося завантажити завдання'); }
    finally { setLoading(false); }
  };

  // Load students when courseId becomes available
  useEffect(() => {
    const loadStudents = async () => {
      if (!(user && (user.role === 'TEACHER' || user.role === 'ADMINISTRATOR'))) return;
      if (!courseId) return;
      if (studentsForSelect.length > 0 || studentsLoading) return;
      setStudentsLoading(true);
      setStudentsError("");
      if (debugSubsEnabled) console.log('[SubmissionsDebug] Loading students for course', courseId);
      try {
        const groupsRes = await relationsApi.getCourseGroups(courseId);
        const groups = Array.isArray(groupsRes.data) ? groupsRes.data : [];
        setCourseGroups(groups);
        const aggregated: User[] = [];
        for (const g of groups) {
          try {
            const usersRes = await relationsApi.getGroupUsers(g.id);
            const stu = (Array.isArray(usersRes.data) ? usersRes.data : []).filter(u => u.role === 'STUDENT');
            stu.forEach(s => { if (!aggregated.some(x => x.id === s.id)) aggregated.push(s); });
          } catch (inner) {
            if (debugSubsEnabled) console.warn('[SubmissionsDebug] Failed group users', g.id, inner);
          }
        }
        setStudentsForSelect(aggregated);
        if (aggregated.length === 0) setStudentsError('Немає студентів у групах цього курсу');
        if (debugSubsEnabled) console.log('[SubmissionsDebug] Loaded students', aggregated);
      } catch (err:any) {
        if (err?.response?.status === 403) setStudentsError('Немає доступу: потрібні права'); else setStudentsError('Не вдалося завантажити список студентів');
      } finally { setStudentsLoading(false); }
    };
    loadStudents();
  }, [courseId, user?.role, studentsForSelect.length, studentsLoading, debugSubsEnabled]);

  useEffect(() => { fetchAll(); }, [numericTaskId, user?.role]);
  useEffect(() => {
    const run = async () => {
      if (!(user && (user.role === 'TEACHER' || user.role === 'ADMINISTRATOR'))) return;
      if (!selectedUserId) return;
      if (debugSubsEnabled) {
        console.log('[SubmissionsDebug] Fetching submissions for task', numericTaskId, 'user', selectedUserId);
      }
      try {
        const subs = await teacherApi.getTaskSubmissionsForUser(numericTaskId, selectedUserId);
        if (Array.isArray(subs)) {
          setAllSubs(subs);
          if (subs.length === 0) setSubmissionsHint('Немає робіт для обраного студента'); else setSubmissionsHint('');
        } else {
          setAllSubs([]);
          setSubmissionsHint('Неочікуваний формат відповіді (не масив)');
        }
      } catch (e: any) {
        setAllSubs([]);
        if (e?.response?.status === 400) setSubmissionsHint('Перевір userId — сервер повернув 400');
        else if (e?.response?.status === 403) setSubmissionsHint('Немає прав для перегляду робіт цього студента');
        else setSubmissionsHint('Не вдалося завантажити роботи');
      }
    };
    run();
  }, [selectedUserId, user?.role, numericTaskId, debugSubsEnabled]);

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const submitFile: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (!file || !numericTaskId) return;
    setSubmitting(true);
    try {
      await studentApi.submitFileTask(numericTaskId, file);
      notify('Файл надіслано', 'success');
      setFile(null);
      fetchAll();
    } catch (err) {
      notify('Не вдалося відправити файл', 'error');
    } finally { setSubmitting(false); }
  };

  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState<number>(0);
  const submitGrade: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (!gradingId) return;
    try {
      const target = allSubs.find(s => s.id === gradingId);
      if (!target) return;
      if (target.content) {
        await submissionsApi.gradeTest(gradingId, gradeValue);
      } else {
        await submissionsApi.gradeFile(gradingId, gradeValue);
      }
      notify('Оцінку збережено', 'success');
      setGradingId(null);
      setGradeValue(0);
      fetchAll();
    } catch (err) {
      notify('Не вдалося зберегти оцінку', 'error');
    }
  };

  const groupsMap = useMemo(() => {
    const m: Record<number,string> = {};
    courseGroups.forEach(g => { m[g.id] = g.name; });
    return m;
  }, [courseGroups]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return studentsForSelect;
    const q = studentSearch.trim().toLowerCase();
    return studentsForSelect.filter(s => (s.fio || s.username || '').toLowerCase().includes(q) || (s.id + '').includes(q));
  }, [studentSearch, studentsForSelect]);
  const openAnswers = (sub: Submission) => {
    if (!sub.content) return;
    setAnswersModal({ open: true, submission: sub });
  };
  const parsedAnswers = useMemo(() => {
    if (!answersModal.open || !answersModal.submission?.content) return null;
    try {
      const obj = JSON.parse(answersModal.submission.content);
      return obj.answers || [];
    } catch { return null; }
  }, [answersModal]);
  useEffect(() => {
    if (debugSubsEnabled && answersModal.open) {
      console.log('[SubmissionsDebug] Parsed answers', parsedAnswers);
    }
  }, [parsedAnswers, answersModal, debugSubsEnabled]);

  if (loading) return <div className="dashboard-container"><p>Завантаження...</p></div>;
  if (error) return <div className="dashboard-container"><p className="error-message">{error}</p></div>;
  if (!task) return <div className="dashboard-container"><p>Завдання не знайдено.</p></div>;

  return (
    <ErrorBoundary>
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Завдання: {task.name}</h1>
        <Link to={courseId ? `/course/${courseId}` : '#'} className="btn-secondary" style={{width:'auto'}}>Назад до курсу</Link>
      </header>

      {new URLSearchParams(window.location.search).get('debugOverlay') === '1' && (
        <section className="card" style={{border:'2px dashed #f59e0b'}}>
          <h3>Overlay Debug</h3>
          <p className="text-muted">Перевір великі елементи що можуть накривати екран. Клік по кнопці видаляє елемент.</p>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}}>
            <button className="btn-secondary btn-small" onClick={() => {
              const arr: HTMLElement[] = (window as any).__overlayCandidates || [];
              arr.forEach(el => { if (!el.closest('#root')) el.parentElement?.removeChild(el); });
              alert('Спроба масового видалення виконана');
            }}>Масово прибрати</button>
            <button className="btn-secondary btn-small" onClick={() => {
              console.log('[OverlayDebug] Повні дані:', (window as any).__overlayCandidatesData);
              alert('Дані записані в console');
            }}>Log дані</button>
          </div>
          <ul style={{fontSize:'0.7rem', margin:0, padding:0, listStyle:'none', maxHeight:240, overflowY:'auto'}}>
            {(((window as any).__overlayCandidatesData) || []).map((info: any, i: number) => (
              <li key={i} style={{borderBottom:'1px solid var(--border)', padding:'4px 0', display:'flex', flexDirection:'column', gap:4}}>
                <div><strong>{info.tag}</strong> #{info.id} .{info.className}</div>
                <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                  <span>Z:{info.zIndex}</span>
                  <span>BG:{info.bg}</span>
                  <span>Opacity:{info.opacity}</span>
                  <span>PE:{info.pointerEvents}</span>
                  <span>{Math.round(info.w)}x{Math.round(info.h)}</span>
                  <button className="btn-danger btn-small" style={{marginLeft:'auto'}} onClick={() => {
                    const els: HTMLElement[] = (window as any).__overlayCandidates || [];
                    const el = els[i];
                    if (el && !el.closest('#root')) { el.parentElement?.removeChild(el); }
                  }}>X</button>
                </div>
              </li>
            ))}
            {(!((window as any).__overlayCandidatesData) || (window as any).__overlayCandidatesData.length === 0) && <li>Немає кандидатів</li>}
          </ul>
        </section>
      )}
      <main className="dashboard-content" style={{display:'block'}}>
        <section className="card">
          <h3>Опис завдання</h3>
          {isTest ? (
            <div className="test-meta">
              <p><strong>Тип:</strong> Тест</p>
              <p><strong>Питань:</strong> {questions.length}</p>
              <p><strong>Макс. бал:</strong> {task.maxMark ?? 'N/A'}</p>
              <p><strong>Термін здачі:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleString('uk-UA') : 'N/A'}</p>
            </div>
          ) : (
            <>
              <p>{task.description || 'Немає опису.'}</p>
              <p><strong>Макс. бал:</strong> {task.maxMark ?? 'N/A'}</p>
              <p><strong>Термін здачі:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleString('uk-UA') : 'N/A'}</p>
            </>
          )}
        </section>

        {user?.role === 'STUDENT' && isTest && (
          <TestRunner taskId={task.id} initial={questions} locked={locked} onSubmitted={fetchAll} />
        )}

        {user && user.role !== 'STUDENT' && isTest && (
          <section className="card">
            <TestEditor taskId={task.id} initial={questions} onUpdated={(qs:any)=>setQuestions(qs)} />
          </section>
        )}

        {user?.role === 'STUDENT' && !isTest && (
          <section className="card">
            <h3>Здати роботу (Файл)</h3>
            <form onSubmit={submitFile}>
              <div className="form-group">
                <label htmlFor="file-upload">Виберіть файл</label>
                <input id="file-upload" type="file" onChange={onFileChange} />
              </div>
              <button className="btn-primary" disabled={!file || submitting}>
                {submitting ? 'Відправка...' : 'Відправити'}
              </button>
            </form>
          </section>
        )}

        {user && user.role !== 'STUDENT' && (
          <section className="card">
            <h3>Роботи студентів</h3>
            {debugSubsEnabled && (
              <div style={{background:'var(--bg-body)', border:'1px solid var(--border)', padding:'8px 10px', borderRadius:8, marginBottom:'10px'}}>
                <strong style={{fontSize:'.75rem'}}>DEBUG SUBMISSIONS</strong>
                <div style={{fontSize:'.7rem', display:'flex', flexDirection:'column', gap:4, marginTop:6}}>
                  <span>taskId: {numericTaskId}</span>
                  <span>courseId: {courseId ?? '—'}</span>
                  <span>selectedUserId: {selectedUserId ?? '—'}</span>
                  <span>studentsLoaded: {studentsForSelect.length}{studentsLoading ? ' (loading...)' : ''}</span>
                  <span>subsCount: {allSubs.length}</span>
                </div>
              </div>
            )}
            <div style={{display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'0.75rem'}}>
              <label style={{fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em'}}>Студент</label>
              <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                <select
                  value={selectedUserId ?? ''}
                  onChange={e => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                  style={{minWidth:'240px'}}
                  disabled={studentsLoading || (!!studentsError && studentsForSelect.length===0)}
                >
                  <option value="">— Оберіть студента —</option>
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.fio || s.username} (#{s.id}){s.groupId && groupsMap[s.groupId] ? ` • ${groupsMap[s.groupId]}` : ''}</option>
                  ))}
                </select>
                {selectedUserId && (
                  <button type="button" className="btn-secondary btn-small" onClick={()=>setSelectedUserId(null)}>Очистити</button>
                )}
                <input
                  type="text"
                  placeholder="Пошук..."
                  value={studentSearch}
                  onChange={e=>setStudentSearch(e.target.value)}
                  style={{flex:'1 1 180px', minWidth:'180px'}}
                />
              </div>
              {studentsLoading && <p style={{margin:0, fontSize:'0.75rem', color:'var(--text-secondary)'}}>Завантаження студентів...</p>}
              {studentsError && !studentsLoading && <p style={{margin:0, fontSize:'0.75rem', color:'var(--error)'}}>{studentsError}</p>}
              {submissionsHint && <p style={{margin:0, fontSize:'0.75rem', color:'var(--text-secondary)'}}>{submissionsHint}</p>}
            </div>
            {selectedUserId && allSubs.length === 0 ? <p>Немає робіт.</p> : null}
            {selectedUserId && allSubs.length > 0 && (
              <ul style={{listStyle:'none', padding:0, margin:0}}>
                {allSubs.map(sub => {
                  const isTestSubmission = !!sub.content && !sub.contentUrl;
                  const typeLabel = isTestSubmission ? 'TEST' : (sub.contentUrl ? 'FILE' : '—');
                  return (
                    <li key={sub.id} style={{borderBottom:'1px solid var(--border)', padding:'0.75rem 0'}}>
                      <div style={{display:'flex', gap:12, flexWrap:'wrap', justifyContent:'space-between'}}>
                        <span><strong>User #{sub.userId}</strong> – {new Date(sub.submitted).toLocaleString('uk-UA')}</span>
                        <span>Тип: <span style={{fontWeight:600}}>{typeLabel}</span></span>
                        <span>Статус: {sub.status}</span>
                        <span>Оцінка: {sub.grade ?? '—'}</span>
                      </div>
                      <div style={{display:'flex', gap:8, alignItems:'center', marginTop:8, flexWrap:'wrap'}}>
                        {isTestSubmission && <button className="btn-secondary btn-small" onClick={()=>openAnswers(sub)}>Відповіді</button>}
                        <button className="btn-secondary btn-small" onClick={() => { setGradingId(sub.id); setGradeValue(sub.grade || 0); }}>Оцінити</button>
                        {gradingId === sub.id && (
                          <form onSubmit={submitGrade} style={{display:'flex', gap:8, alignItems:'center'}}>
                            <input type="number" min={0} max={task.maxMark || 100} value={gradeValue} onChange={e=>setGradeValue(Number(e.target.value || 0))} style={{width:90}} />
                            <button className="btn-primary btn-small" type="submit">Зберегти</button>
                            <button className="btn-secondary btn-small" type="button" onClick={()=>setGradingId(null)}>Скасувати</button>
                          </form>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {user?.role === 'STUDENT' && (
          <section className="card">
            <h3>Мої роботи</h3>
            {safeMySubs.length === 0 ? <p>Ви ще не здавали це завдання.</p> : (
              <ul>
                {safeMySubs.map((s, idx) => (
                  <li key={s.id + '_' + idx}>
                    {new Date(s.submitted).toLocaleString('uk-UA')} – <strong>{s.status}</strong> – Оцінка: {s.grade ?? 'Немає'}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
    </ErrorBoundary>
  );
}

export default TaskPage;
