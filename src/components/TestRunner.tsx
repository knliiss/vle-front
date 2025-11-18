import React, { useEffect, useState, useMemo } from 'react';
import { testQuestionsApi, studentApi } from '../api/apiService';
import type { TestQuestion } from '../types';
import { useToast } from './ToastProvider';

export type RunnerProps = {
  taskId: number;
  initial?: TestQuestion[];
  locked?: boolean;
  onSubmitted?: () => void;
  existingContentJson?: string;
};

function parseOptions(json?: string | null): { id: string; text: string }[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    if (Array.isArray(v)) return v as { id: string; text: string }[];
    return [];
  } catch {
    return [];
  }
}

const TestRunner: React.FC<RunnerProps> = ({ taskId, initial, locked, onSubmitted, existingContentJson }) => {
  const [questions, setQuestions] = useState<TestQuestion[]>(initial || []);
  const [loading, setLoading] = useState(!initial);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const { notify } = useToast();
  const existingAnswers: Record<number, string[]> = useMemo(() => {
    if (!locked || !existingContentJson) return {};
    try {
      const parsed = JSON.parse(existingContentJson);
      if (parsed && Array.isArray(parsed.answers)) {
        const map: Record<number,string[]> = {};
        parsed.answers.forEach((a: any) => {
          const qid = Number(a.questionId);
          if (!map[qid]) map[qid] = [];
          if (Array.isArray(a.optionIds)) map[qid] = a.optionIds.map(String);
        });
        return map;
      }
    } catch {}
    return {};
  }, [locked, existingContentJson]);

  useEffect(() => {
    let mounted = true;
    if (initial && initial.length) { setQuestions(initial); setLoading(false); return; }
    setLoading(true);
    testQuestionsApi.listByTask(taskId)
        .then(res => { if (mounted) setQuestions(res.data.sort((a,b)=> (a.order||0)-(b.order||0))); })
        .catch(err => { console.error(err); if (mounted) notify('Не вдалося завантажити питання', 'error'); })
        .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [taskId, initial, notify]);

  const setChoice = (qid: number, optId: string, multi: boolean) => {
    setAnswers(prev => {
      const current = prev[qid] || [];
      if (!multi) return { ...prev, [qid]: [optId] };
      const exists = current.includes(optId);
      return { ...prev, [qid]: exists ? current.filter(x => x !== optId) : [...current, optId] };
    });
  };

  const setFreeText = (qid: number, value: string) => {
    setAnswers(prev => ({ ...prev, [qid]: [value] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([qid, values]) => ({ questionId: qid, optionIds: values }))
      } as any;
      await studentApi.submitTestTask(taskId, JSON.stringify(payload));
      notify('Відповіді відправлено', 'success');
      onSubmitted?.();
    } catch (err) {
      console.error(err);
      notify('Не вдалося відправити відповіді', 'error');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="card"><p>Завантаження тесту...</p></div>;
  if (!questions.length) return <div className="card"><p>Цей тест поки без питань.</p></div>;

  const devOverlayPresent = typeof document !== 'undefined' && (
    document.getElementById('vite-error-overlay') || document.querySelector('.vite-error-overlay')
  );

  return (
    <section className="card">
      <h3>Тест</h3>
      {locked && <p className="text-muted" style={{marginTop:0}}>Ви вже здали цей тест. Відповіді заблоковано.</p>}
      {devOverlayPresent && (
        <div style={{background:'#fef3c7', border:'1px solid #fcd34d', padding:'6px 10px', borderRadius:6, marginBottom:8}}>
          <strong>Diagnostic:</strong> Виявлено dev overlay. <button type="button" className="btn-secondary btn-small" onClick={() => {
            const el1 = document.getElementById('vite-error-overlay');
            const els = document.querySelectorAll('.vite-error-overlay');
            if (el1) el1.parentElement?.removeChild(el1);
            els.forEach(n=>n.parentElement?.removeChild(n));
          }}>Прибрати</button>
        </div>
      )}
      {locked && Object.keys(existingAnswers).length > 0 && (
        <div style={{marginBottom:'1rem'}}>
          <h4 style={{margin:'0 0 .5rem'}}>Ваші відповіді</h4>
          <ul style={{listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:8}}>
            {questions.map(q => {
              const ans = existingAnswers[q.id] || [];
              const free = q.questionType === 'FREE_TEXT';
              const opts = parseOptions(q.optionsJson);
              return (
                <li key={q.id} style={{border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px', background:'var(--bg-body)'}}>
                  <div style={{fontWeight:600, marginBottom:4}}>{q.order}. {q.text}</div>
                  {!free && (
                    <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                      {opts.map(o => {
                        const chosen = ans.includes(o.id);
                        return (
                          <span key={o.id} style={{padding:'4px 8px', borderRadius:6, fontSize:'.75rem', border:'1px solid var(--border)', background: chosen ? 'var(--primary-light)' : 'transparent', color: chosen ? 'var(--primary)' : 'var(--text-secondary)'}}>
                            {o.text}
                          </span>
                        );
                      })}
                      {opts.length === 0 && <em className="text-muted">Немає варіантів</em>}
                    </div>
                  )}
                  {free && (
                    <div style={{marginTop:4, fontSize:'.85rem', background:'var(--bg-surface)', padding:'6px 8px', borderRadius:6}}>{ans[0] || <em className="text-muted">(Порожньо)</em>}</div>
                  )}
                  <div style={{marginTop:6, fontSize:'.65rem', textTransform:'uppercase', letterSpacing:'.05em', color:'var(--text-secondary)'}}>
                    Тип: {q.questionType} | Бали: {q.maxScore ?? 0}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <ul style={{listStyle:'none', padding:0, margin:0}}>
          {questions.map((q) => {
            const type = q.questionType; // SINGLE_CHOICE | MULTIPLE_CHOICE | FREE_TEXT
            const opts = parseOptions(q.optionsJson);
            const multi = type === 'MULTIPLE_CHOICE';
            const free = type === 'FREE_TEXT';
            const readOnlyAnswers = locked ? existingAnswers[q.id] || [] : [];
            return (
              <li key={q.id} className="test-question">
                <strong className="test-question-text">{q.order}. {q.text}</strong>
                <div className="test-options">
                  {free ? (
                    <textarea
                      disabled={!!locked || submitting}
                      value={locked ? (readOnlyAnswers[0] || '') : (answers[q.id]?.[0] || '')}
                      placeholder="Введіть відповідь"
                      onChange={(e) => !locked && setFreeText(q.id, e.target.value)}
                      style={{minHeight: 90, resize: 'vertical'}}
                    />
                  ) : (
                    opts.map(o => (
                      <label className="test-option" key={o.id}>
                        <input
                          type={multi ? 'checkbox' : 'radio'}
                          name={`q_${q.id}`}
                          value={o.id}
                          disabled={!!locked || submitting}
                          checked={locked ? readOnlyAnswers.includes(o.id) : multi ? (answers[q.id]?.includes(o.id) || false) : (answers[q.id]?.[0] === o.id)}
                          onChange={() => !locked && setChoice(q.id, o.id, multi)}
                        />
                        <span>{o.text}</span>
                      </label>
                    ))
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div style={{display:'flex', justifyContent:'flex-end', marginTop:12}}>
          <button type="submit" className="btn-primary" disabled={!!locked || submitting}>
            {locked ? 'Тест вже здано' : (submitting ? 'Надсилання...' : 'Відправити відповіді')}
          </button>
        </div>
      </form>
    </section>
  );
};

export default TestRunner;
