"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./KanbanBoard.module.css";
import { useRouter } from "next/navigation";

// Basic Types
type Task = {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  assignee?: string;
  dueDate?: Date | string;
  status?: string;
  history?: { date: string, text: string }[];
  subtasks?: { id: string, title: string, isDone: boolean }[];
};

type ColumnType = {
  id: string;
  title: string;
  tasks: Task[];
};

// Helper: formats a date string or Date to DD/MM/AAAA without timezone shift
function formatDateBR(d: Date | string | undefined): string {
  if (!d) return '';
  const str = typeof d === 'string' ? d : d.toISOString();
  // Extract YYYY-MM-DD from ISO string or raw string
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

// Helper: extracts YYYY-MM-DD from a date without timezone issues
function toDateInputValue(d: Date | string | undefined): string {
  if (!d) return '';
  const str = typeof d === 'string' ? d : d.toISOString();
  const match = str.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

export default function KanbanBoard({ 
  initialColumns, 
  boardId, 
  members = [],
  projects = []
}: { 
  initialColumns: ColumnType[], 
  boardId: string, 
  members?: { id: string, name: string }[],
  projects?: { id: string, name: string }[]
}) {
  const router = useRouter();
  const [columns, setColumns] = useState<ColumnType[]>(initialColumns);
  
  const [filterText, setFilterText] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterProject, setFilterProject] = useState("");

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({});
  const [newHistoryEntry, setNewHistoryEntry] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColTitle, setEditingColTitle] = useState("");
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleOpenModal = (columnId: string, task?: Task) => {
    setActiveColumn(columnId);
    if (task) {
      setNewTask({ ...task });
    } else {
      setNewTask({ priority: "Medium", status: "Standby" });
    }
    setNewHistoryEntry("");
    setIsModalOpen(true);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string, sourceColId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("sourceColId", sourceColId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceColId = e.dataTransfer.getData("sourceColId");

    if (!taskId || sourceColId === targetColId) return;

    // Optimistic UI update
    setColumns(prev => {
      const newCols = JSON.parse(JSON.stringify(prev));
      const sourceCol = newCols.find((c: any) => c.id === sourceColId);
      const targetCol = newCols.find((c: any) => c.id === targetColId);
      if (!sourceCol || !targetCol) return prev;
      
      const taskIndex = sourceCol.tasks.findIndex((t: any) => t.id === taskId);
      if (taskIndex === -1) return prev;
      
      const [task] = sourceCol.tasks.splice(taskIndex, 1);
      targetCol.tasks.push(task);
      return newCols;
    });

    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, listId: targetColId, historyLog: `Movido para coluna ${targetColId}` })
      });
      if (!response.ok) throw new Error("Failed to update task");
      router.refresh();
    } catch (error) {
      console.error("Failed to move task", error);
      setColumns(initialColumns); // Rollback
    }
  };

  const handleSaveTask = async () => {
    if (!activeColumn || !newTask.title) return;
    setIsSaving(true);
    
    // Create payload
    const payload = {
      ...newTask,
      listId: activeColumn,
      historyLog: newHistoryEntry || undefined
    };

    try {
      if (!newTask.id) {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      // Update local state optimistically for immediate feedback
      setColumns(prev => {
        const newCols = [...prev];
        const col = newCols.find(c => c.id === activeColumn);
        if (col) {
          if (newTask.id) {
            col.tasks = col.tasks.map(t => t.id === newTask.id ? { ...t, ...newTask } as Task : t);
          } else {
            // Task creation will be fully synced on refresh
          }
        }
        return newCols;
      });

      router.refresh();
      setIsModalOpen(false);
      setNewTask({});
      setNewHistoryEntry("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Tem certeza que deseja apagar esta tarefa? Esta ação não pode ser desfeita.")) return;
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      // Optimistic update
      setColumns(prev => prev.map(c => ({
        ...c,
        tasks: c.tasks.filter(t => t.id !== taskId)
      })));
      setIsModalOpen(false);
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSubtask = async () => {
    const title = prompt("Nova subtarefa:");
    if (!title || !newTask.id) return;
    try {
      const res = await fetch('/api/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, cardId: newTask.id })
      });
      const data = await res.json();
      if (data.success) {
        setNewTask(prev => ({
          ...prev,
          subtasks: [...(prev.subtasks || []), data.subtask]
        }));
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, isDone: boolean, title: string) => {
    // Optimistic update
    setNewTask(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).map(s => s.id === subtaskId ? { ...s, isDone: !isDone } : s)
    }));
    try {
      await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: !isDone, title })
      });
      router.refresh();
    } catch (e) {
      console.error(e);
      // Revert optimistic update ideally
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm("Apagar subtarefa?")) return;
    // Optimistic update
    setNewTask(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).filter(s => s.id !== subtaskId)
    }));
    try {
      await fetch(`/api/subtasks/${subtaskId}`, { method: 'DELETE' });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddList = async () => {
    const title = prompt("Nome da nova coluna:");
    if (!title) return;
    
    try {
      await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, boardId })
      });
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const saveColTitle = async (colId: string) => {
    if (!editingColTitle) {
      setEditingColId(null);
      return;
    }
    
    // Optimistic
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, title: editingColTitle } : c));

    try {
      await fetch('/api/lists', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: colId, title: editingColTitle })
      });
      router.refresh();
    } catch (e) {
      console.error(e);
      setColumns(initialColumns);
    }
    setEditingColId(null);
  };

  return (
    <div className={styles.boardWrapper}>
      <div className={styles.filterBar} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
        <input 
          type="text" 
          placeholder="Buscar por hashtag ou texto..." 
          className={styles.input} 
          style={{ flex: 1, margin: 0 }}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
        <select 
          className={styles.select} 
          style={{ margin: 0, minWidth: '150px' }}
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
        >
          <option value="">👤 Qualquer Membro</option>
          {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          <option value="Maia">Maia</option>
        </select>
        <select 
          className={styles.select} 
          style={{ margin: 0, minWidth: '150px' }}
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
        >
          <option value="">📁 Qualquer Projeto</option>
          {projects.map(p => <option key={p.id} value={`[Projeto] ${p.name}`}>[Projeto] {p.name}</option>)}
        </select>
      </div>

    <div className={styles.board}>
      {columns.map((col) => {
        // Apply filters
        let filteredTasks = col.tasks;
        if (filterText) {
          const lowerText = filterText.toLowerCase();
          filteredTasks = filteredTasks.filter(t => 
            t.title.toLowerCase().includes(lowerText) || 
            (t.description && t.description.toLowerCase().includes(lowerText))
          );
        }
        if (filterAssignee) {
          filteredTasks = filteredTasks.filter(t => t.assignee === filterAssignee);
        }
        if (filterProject) {
          const lowerProj = filterProject.toLowerCase();
          filteredTasks = filteredTasks.filter(t => 
            t.title.toLowerCase().includes(lowerProj) || 
            (t.description && t.description.toLowerCase().includes(lowerProj))
          );
        }

        // Sort tasks within each column by due date
        const sortedTasks = [...filteredTasks].sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        return (
          <div 
            key={col.id} 
            className={styles.column}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className={styles.columnHeader} onDoubleClick={() => {setEditingColId(col.id); setEditingColTitle(col.title);}}>
              {editingColId === col.id ? (
                <input 
                  autoFocus 
                  className={styles.input} 
                  value={editingColTitle} 
                  onChange={e => setEditingColTitle(e.target.value)}
                  onBlur={() => saveColTitle(col.id)}
                  onKeyDown={e => e.key === 'Enter' && saveColTitle(col.id)}
                />
              ) : (
                <h2 className={styles.columnTitle}>{col.title}</h2>
              )}
              <span className={styles.badge}>{col.tasks.length}</span>
            </div>
            
            <div className={styles.taskList} onDragOver={handleDragOver}>
              {sortedTasks.map((task) => {
                const statusClass = (() => {
                  const s = task.status?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-') || 'standby';
                  if (s === 'em-andamento') return styles.statusBarEmAndamento;
                  if (s === 'aguardando-revisao') return styles.statusBarAguardandoRevisao;
                  if (s === 'finalizado') return styles.statusBarFinalizado;
                  return styles.statusBarStandby;
                })();

                return (
                <div 
                  key={task.id} 
                  className={styles.card} 
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, task.id, col.id)}
                  onClick={() => handleOpenModal(col.id, task)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={`${styles.statusBar} ${statusClass}`} />
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{task.title}</h3>
                    <span className={`${styles.priorityIndicator} ${styles[task.priority.toLowerCase()]}`} />
                  </div>
                {task.status && <div className={styles.statusBadge}>{task.status}</div>}
                <p className={styles.cardDescription}>{task.description}</p>
                {task.dueDate && (
                  <div className={styles.cardDate}>
                    📅 {formatDateBR(task.dueDate)}
                  </div>
                )}
                {task.assignee && (
                  <div className={styles.assigneeWrapper}>
                    <div className={styles.assigneeAvatar}>
                      {task.assignee.charAt(0).toUpperCase()}
                    </div>
                    <span className={styles.assigneeName}>{task.assignee}</span>
                  </div>
                )}
              </div>
              );
              })}
          </div>
          
          <button 
            className={styles.addCardBtn}
            onClick={() => handleOpenModal(col.id)}
          >
            + Adicionar Tarefa
          </button>
        </div>
      );
      })}
      <div className={styles.addColumnWrapper}>
        <button className={styles.addColumnBtn} onClick={handleAddList}>+ Adicionar Coluna</button>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{newTask.id ? "Editar Tarefa" : "Nova Tarefa"}</h3>
            <input 
              placeholder="Título da Tarefa" 
              className={styles.input}
              value={newTask.title || ""}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            />
            <textarea 
              placeholder="Descrição" 
              className={styles.textarea}
              value={newTask.description || ""}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
            <div className={styles.modalRow}>
              <select 
                className={styles.select}
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
              >
                <option value="Low">Baixa Prioridade</option>
                <option value="Medium">Média Prioridade</option>
                <option value="High">Alta Prioridade</option>
              </select>
              <select 
                className={styles.select}
                value={newTask.status || "Standby"}
                onChange={(e) => setNewTask({...newTask, status: e.target.value})}
              >
                <option value="Standby">Standby</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Aguardando Revisão">Aguardando Revisão</option>
                <option value="Finalizado">Finalizado</option>
              </select>
              <select
                className={styles.select}
                value={newTask.assignee || ""}
                onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
              >
                <option value="">Selecionar Responsável</option>
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
                <option value="Maia">Maia</option>
              </select>
              <div 
                className={styles.datePickerWrapper}
                onClick={() => dateInputRef.current?.showPicker()}
              >
                <div className={styles.dateDisplay}>
                  {newTask.dueDate ? `📅 ${formatDateBR(newTask.dueDate)}` : '📅 Selecionar data'}
                </div>
                <input 
                  ref={dateInputRef}
                  type="date"
                  className={styles.hiddenDateInput}
                  value={toDateInputValue(newTask.dueDate)}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value || undefined})}
                />
              </div>
            </div>
            
            {newTask.id && (
              <div className={styles.subtasksSection} style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0 }}>Subtarefas</h4>
                  <button 
                    onClick={handleAddSubtask}
                    style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    + Adicionar
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {newTask.subtasks?.map(sub => (
                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-hover)', padding: '0.5rem', borderRadius: '6px' }}>
                      <input 
                        type="checkbox" 
                        checked={sub.isDone} 
                        onChange={() => handleToggleSubtask(sub.id, sub.isDone, sub.title)} 
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ flex: 1, textDecoration: sub.isDone ? 'line-through' : 'none', color: sub.isDone ? 'var(--text-muted)' : 'var(--foreground)' }}>
                        {sub.title}
                      </span>
                      <button onClick={() => handleDeleteSubtask(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>
                        🗑️
                      </button>
                    </div>
                  ))}
                  {(!newTask.subtasks || newTask.subtasks.length === 0) && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhuma subtarefa adicionada.</span>
                  )}
                </div>
              </div>
            )}

            {newTask.id && (
              <div className={styles.historySection} style={{ marginTop: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Histórico de Andamento</h4>
                <div className={styles.historyLog}>
                  {newTask.history?.map((h, i) => (
                    <div key={i} className={styles.historyItem}>
                      <span className={styles.historyDate}>{new Date(h.date).toLocaleString()}</span>
                      <span className={styles.historyText}>{h.text}</span>
                    </div>
                  ))}
                </div>
                <input 
                  placeholder="Adicionar nota ao histórico..." 
                  className={styles.input}
                  value={newHistoryEntry}
                  onChange={e => setNewHistoryEntry(e.target.value)}
                  style={{ marginTop: '0.5rem' }}
                />
              </div>
            )}
            
            <div className={styles.modalActions} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <div>
                {newTask.id && (
                  <button 
                    onClick={() => handleDeleteTask(newTask.id!)}
                    style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    🗑️ Excluir Tarefa
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button className={styles.saveBtn} onClick={handleSaveTask} disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar Tarefa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
