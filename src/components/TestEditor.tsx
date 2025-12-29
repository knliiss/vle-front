import React, { useEffect, useState } from 'react';
import { testQuestionsApi } from '../api/apiService';
import { useToast } from './ToastProvider';
import ConfirmDialog from './ConfirmDialog';

type QDto = {
  id?: number | null;
  taskId: number;
  order: number;
  text: string;
  questionType: string;
  optionsJson?: string | null;
  maxScore?: number | null;
};

interface Props {
  taskId: number;
  initial?: QDto[];
  onUpdated?: (qs: QDto[]) => void;
}

const parseOptions = (json?: string | null) => {
  if (!json) return [] as { id: string; text: string }[];
  try { return JSON.parse(json); } catch { return []; }
};

const defaultOptions = () => [{ id: 'a', text: '' }, { id: 'b', text: '' }];

const TestEditor: React.FC<Props> = ({ taskId, initial = [], onUpdated }) => {
  const [questions, setQuestions] = useState<QDto[]>(initial || []);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<({ id?: number | null } & QDto & { options: { id: string; text: string }[] }) | null>(null);
  const [createDraft, setCreateDraft] = useState<{ text: string; questionType: string; maxScore: number; options: { id: string; text: string }[] }>({ text: '', questionType: 'SINGLE_CHOICE', maxScore: 1, options: defaultOptions() });
  const { notify } = useToast();

  const reload = async () => {
    setLoading(true);
    try {
      const res = await testQuestionsApi.listByTask(taskId);
      const data = res.data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((q: any) => ({ ...q, questionType: normalizeType(q.questionType) }));
      setQuestions(data);
      onUpdated?.(data);
    } catch (err) {
      console.error(err);
      notify('Не вдалося завантажити питання', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, [taskId]);

  const normalizeType = (t: string): string => {
    if (t === 'SINGLE' || t === 'SINGLE_CHOICE') return 'SINGLE_CHOICE';
    if (t === 'MULTI' || t === 'MULTIPLE_CHOICE') return 'MULTIPLE_CHOICE';
    if (t === 'FREE_TEXT') return 'FREE_TEXT';
    return 'SINGLE_CHOICE';
  };

  // Create flows
  const handleCreateAddOption = () => {
    setCreateDraft(d => ({ ...d, options: [...d.options, { id: String.fromCharCode(97 + d.options.length), text: '' }] }));
  };
  const handleCreateRemoveOption = (id: string) => {
    setCreateDraft(d => ({ ...d, options: d.options.filter(o => o.id !== id).map((o, idx) => ({ ...o, id: String.fromCharCode(97 + idx) })) }));
  };
  const handleCreateOptionText = (id: string, text: string) => {
    setCreateDraft(d => ({ ...d, options: d.options.map(o => o.id === id ? { ...o, text } : o) }));
  };

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!createDraft.text.trim()) { notify('Вкажіть текст питання', 'warning'); return; }
    try {
      const isFree = createDraft.questionType === 'FREE_TEXT';
      const payload = { taskId, order: (questions.length || 0) + 1, text: createDraft.text.trim(), questionType: createDraft.questionType, optionsJson: isFree ? undefined : JSON.stringify(createDraft.options), maxScore: createDraft.maxScore || undefined };
      await testQuestionsApi.create(payload);
      notify('Питання додано', 'success');
      setCreateDraft({ text: '', questionType: 'SINGLE_CHOICE', maxScore: 1, options: defaultOptions() });
      await reload();
    } catch (err) { console.error(err); notify('Не вдалося додати питання', 'error'); }
  };

  // Edit flows
  const startEdit = (q: QDto) => {
    setEditingId(q.id || null);
    const isFree = normalizeType(q.questionType) === 'FREE_TEXT';
    setEditDraft({ ...q, questionType: normalizeType(q.questionType), options: isFree ? [] : (parseOptions(q.optionsJson) as { id: string; text: string }[]) });
  };
  const cancelEdit = () => { setEditingId(null); setEditDraft(null); };
  const editAddOption = () => {
    if (!editDraft) return;
    setEditDraft(d => d ? ({ ...d, options: [...d.options, { id: String.fromCharCode(97 + d.options.length), text: '' }] }) : d);
  };
  const editRemoveOption = (id: string) => {
    if (!editDraft) return;
    setEditDraft(d => d ? ({ ...d, options: d.options.filter(o => o.id !== id).map((o, idx) => ({ ...o, id: String.fromCharCode(97 + idx) })) }) : d);
  };
  const handleSaveEdit = async () => {
    if (!editDraft || !editDraft.id) return;
    if (!editDraft.text.trim()) { notify('Вкажіть текст питання', 'warning'); return; }
    try {
      const isFree = editDraft.questionType === 'FREE_TEXT';
      await testQuestionsApi.patch(editDraft.id, { order: editDraft.order, text: editDraft.text.trim(), questionType: editDraft.questionType, optionsJson: isFree ? undefined : JSON.stringify(editDraft.options), maxScore: editDraft.maxScore || undefined });
      notify('Питання збережено', 'success');
      cancelEdit();
      await reload();
    } catch (err) { console.error(err); notify('Не вдалося зберегти питання', 'error'); }
  };

  // Delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('Підтвердити видалення');
  const [confirmMessage, setConfirmMessage] = useState('Видалити питання?');

  const handleDelete = (id?: number | null) => {
    if (!id) return;
    setPendingDeleteId(id);
    setConfirmTitle('Видалити питання');
    setConfirmMessage('Ви впевнені, що хочете видалити це питання?');
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    const id = pendingDeleteId;
    if (!id) { setConfirmOpen(false); return; }
    try {
      await testQuestionsApi.delete(id);
      notify('Питання видалено', 'info');
      await reload();
    } catch (err) {
      console.error(err);
      notify('Не вдалося видалити питання', 'error');
    } finally {
      setPendingDeleteId(null);
      setConfirmOpen(false);
    }
  };

  // Move up / down
  const moveQuestion = async (index: number, direction: 'up'|'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    const a = questions[index];
    const b = questions[targetIndex];
    if (!a.id || !b.id) return;
    try {
      // swap orders using patch
      await Promise.all([
        testQuestionsApi.patch(a.id, { order: b.order }),
        testQuestionsApi.patch(b.id, { order: a.order })
      ]);
      await reload();
    } catch (err) { console.error(err); notify('Не вдалося змінити порядок', 'error'); }
  };

  const duplicateQuestion = async (q: QDto) => {
    try {
      const isFree = normalizeType(q.questionType) === 'FREE_TEXT';
      const payload = { taskId, order: (questions.length || 0) + 1, text: q.text + ' (копія)', questionType: normalizeType(q.questionType), optionsJson: isFree ? undefined : (q.optionsJson || JSON.stringify(parseOptions(q.optionsJson))), maxScore: q.maxScore || undefined };
      await testQuestionsApi.create(payload);
      notify('Питання продубльовано', 'success');
      await reload();
    } catch (err) { console.error(err); notify('Не вдалося продублювати питання', 'error'); }
  };

  return (
    <div className="card test-editor-card">
      <ConfirmDialog open={confirmOpen} title={confirmTitle} message={confirmMessage} onConfirm={handleConfirmDelete} onCancel={() => { setConfirmOpen(false); setPendingDeleteId(null); }} />

      <div className="test-editor-header">
        <h3>Редактор тесту</h3>
        <p className="text-muted">Додайте питання, варіанти відповідей та бали. Порядок можна змінювати.</p>
      </div>

      <form className="create-question" onSubmit={handleCreate}>
        <input className="input-large" placeholder="Нове питання" value={createDraft.text} onChange={e => setCreateDraft(d => ({ ...d, text: e.target.value }))} />
        <div className="create-row">
          <select value={createDraft.questionType} onChange={e => setCreateDraft(d => ({ ...d, questionType: e.target.value }))}>
            <option value="SINGLE_CHOICE">Одна відповідь</option>
            <option value="MULTIPLE_CHOICE">Кілька відповідей</option>
            <option value="FREE_TEXT">Вільний текст</option>
          </select>
          <input type="number" min={0} value={createDraft.maxScore} onChange={e => setCreateDraft(d => ({ ...d, maxScore: Number(e.target.value || 0) }))} className="input-score" />
          <button className="btn-primary" type="submit">Додати питання</button>
        </div>

        <div className="options-editor">
          {createDraft.options.map(o => (
            <div className="option-row" key={o.id}>
              <div className="option-handle">{o.id.toUpperCase()}</div>
              <input value={o.text} onChange={e => handleCreateOptionText(o.id, e.target.value)} placeholder="Текст варіанту" />
              <button type="button" className="btn-secondary btn-small" onClick={() => handleCreateRemoveOption(o.id)} aria-label="Видалити варіант">×</button>
            </div>
          ))}
          <div style={{marginTop:8}}>
            <button type="button" className="btn-secondary btn-small" onClick={handleCreateAddOption}>Додати варіант</button>
          </div>
        </div>
      </form>

      <div className="questions-list">
        {loading && <p>Завантаження...</p>}
        {!loading && questions.length === 0 && <p className="text-muted">Поки немає питань — додайте нове угорі.</p>}
        {questions.map((q, idx) => {
           const isEditing = editingId === q.id;
           return (
            <div className="question-card" key={q.id}>
              <div className="question-top">
                <div className="question-title">
                  <div className="question-order">{q.order}</div>
                  {isEditing ? (
                    <input className="input-inline" value={editDraft?.text || ''} onChange={e => setEditDraft(d => d ? ({ ...d, text: e.target.value }) : d)} />
                  ) : (
                    <div className="question-text">{q.text}</div>
                  )}
                </div>
                <div className="question-actions">
                  <div className="badge">{normalizeType(q.questionType)}</div>
                  <div className="action-group">
                    <button className="btn-icon" title="Вгору" onClick={() => moveQuestion(idx, 'up')} disabled={idx === 0}>▲</button>
                    <button className="btn-icon" title="Вниз" onClick={() => moveQuestion(idx, 'down')} disabled={idx === questions.length - 1}>▼</button>
                    <button className="btn-icon" title="Дублювати" onClick={() => duplicateQuestion(q)}>⧉</button>
                    {isEditing ? (
                          <>
                            <button className="btn-primary btn-small" onClick={() => handleSaveEdit()}>Зберегти</button>
                            <button className="btn-secondary btn-small" onClick={() => cancelEdit()}>Скасувати</button>
                          </>
                        ) : (
                          <>
                            <button className="btn-secondary btn-small" onClick={() => startEdit(q)}>Редагувати</button>
                            <button className="btn-danger btn-small" onClick={() => handleDelete(q.id)}>Видалити</button>
                          </>
                        )}
                  </div>
                </div>
              </div>

              <div className="question-body">
                <div className="score-row">Бали: {isEditing ? (<input type="number" className="input-score" value={editDraft?.maxScore || 0} onChange={e => setEditDraft(d => d ? ({ ...d, maxScore: Number(e.target.value || 0) }) : d)} />) : (<strong>{q.maxScore || 0}</strong>)}</div>

                <div className="options-list">
                  {normalizeType(q.questionType) === 'FREE_TEXT' && !isEditing && (
                    <div className="option-item"><em className="text-muted">Відповідь вводиться як текст студентом</em></div>
                  )}
                  {normalizeType(q.questionType) === 'FREE_TEXT' && isEditing && (
                    <div className="option-item"><em className="text-muted">Для типу "Вільний текст" варіанти не потрібні.</em></div>
                  )}
                  {normalizeType(q.questionType) !== 'FREE_TEXT' && (isEditing ? (editDraft?.options || []) : parseOptions(q.optionsJson)).map((o: any) => (
                    <div className="option-item" key={o.id}>
                      <div className="option-left">{o.id?.toUpperCase()}</div>
                      {isEditing ? (
                        <>
                          <input value={o.text} onChange={e => isEditing ? setEditDraft(d => d ? ({ ...d, options: d.options.map(opt => opt.id === o.id ? { ...opt, text: e.target.value } : opt) }) : d) : null} />
                          <button type="button" className="btn-secondary btn-small" onClick={() => isEditing ? editRemoveOption(o.id) : null}>×</button>
                        </>
                      ) : (
                        <div className="option-text">{o.text}</div>
                      )}
                    </div>
                  ))}

                  {isEditing && normalizeType(q.questionType) !== 'FREE_TEXT' && (
                    <div style={{marginTop:8}}>
                      <button type="button" className="btn-secondary btn-small" onClick={editAddOption}>Додати варіант</button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TestEditor;
