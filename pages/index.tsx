
"use client";
import { useState, useEffect } from "react";
import axios from "axios";

// URL base da nossa API
const API_URL = "http://localhost:3001/tasks";
// Nome do App
const APP_NAME = "TaskFlow 3D | Categorias";

// Definição do tipo para as tarefas
interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  tag?: string;
}

// ==========================================================
// FUNÇÃO PARA ESTILOS DE CATEGORIA (TAG)
// ==========================================================
const getTagStyle = (tag: string | undefined) => {
  const normalizedTag = (tag || "Geral").toLowerCase().trim();
  let colorMap: { primary: string; secondary: string } = { primary: "", secondary: "" };

  switch (normalizedTag) {
    case "trabalho":
      colorMap = { primary: "#FF5733", secondary: "#FFD700" }; // Laranja Fogo
      break;
    case "pessoal":
      colorMap = { primary: "#3399FF", secondary: "#E0FFFF" }; // Azul Claro
      break;
    case "urgente":
    case "bug":
      colorMap = { primary: "#FF33A1", secondary: "#F08080" }; // Rosa Neon
      break;
    case "estudo":
      colorMap = { primary: "#9933FF", secondary: "#DDA0DD" }; // Roxo
      break;
    default:
      colorMap = { primary: PRIMARY_COLOR, secondary: "#A9A9A9" }; // Padrão
  }

  return {
    borderColor: colorMap.primary,
    textColor: colorMap.primary,
    backgroundColor: `${colorMap.primary}30`,
    boxShadow: `0 0 5px ${colorMap.primary}80`,
  };
};

// ==========================================================
// ESTILOS DARK MODE NEUMORFISMO (Efeito 3D)
// ==========================================================
const PRIMARY_COLOR = "#00ADB5";
const SECONDARY_COLOR = "#222831";
const CARD_COLOR = "#393E46";
const TEXT_COLOR = "#EEEEEE";

const DANGER_COLOR = "#e74c3c";
const SUCCESS_COLOR = "#00C853";

const styles: any = {
  bodyBg: SECONDARY_COLOR,
  cardBgColor: CARD_COLOR,
  textColor: TEXT_COLOR,
  completedBorder: SUCCESS_COLOR,
  completedColor: SUCCESS_COLOR,
  container: {
    maxWidth: "800px",
    margin: "40px auto",
    padding: "25px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: SECONDARY_COLOR,
    color: TEXT_COLOR,
    borderRadius: "20px",
    boxShadow: `12px 12px 24px #1d2228, -12px -12px 24px #475460`,
  },
  header: {
    textAlign: "center",
    color: PRIMARY_COLOR,
    fontSize: "2.5em",
    textShadow: `0 0 10px ${PRIMARY_COLOR}a0`,
    marginBottom: "30px",
  },
  form: {
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "30px",
    backgroundColor: CARD_COLOR,
    boxShadow: `inset 5px 5px 10px #2a2e34, inset -5px -5px 10px #484e58`,
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    border: "none",
    borderRadius: "10px",
    boxSizing: "border-box",
    backgroundColor: CARD_COLOR,
    color: TEXT_COLOR,
  },
  textarea: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    border: "none",
    borderRadius: "10px",
    boxSizing: "border-box",
    resize: "vertical",
    backgroundColor: CARD_COLOR,
    color: TEXT_COLOR,
  },
  submitButton: {
    padding: "12px 20px",
    backgroundColor: PRIMARY_COLOR,
    color: SECONDARY_COLOR,
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    marginRight: "10px",
    fontWeight: "bold",
    boxShadow: `5px 5px 10px #1d2228, -5px -5px 10px #475460`,
  },
  cancelButton: {
    padding: "12px 20px",
    backgroundColor: CARD_COLOR,
    color: TEXT_COLOR,
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    boxShadow: `5px 5px 10px #1d2228, -5px -5px 10px #475460`,
  },
  formButtons: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "10px",
  },
  hr: {
    border: "0",
    height: "1px",
    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0), ${PRIMARY_COLOR}, rgba(0, 0, 0, 0))`,
    margin: "30px 0",
  },
  list: {
    listStyle: "none",
    padding: 0,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px",
    marginBottom: "15px",
    borderRadius: "15px",
    backgroundColor: CARD_COLOR,
    boxShadow: `8px 8px 16px #1d2228, -8px -8px 16px #475460`,
  },
  taskContent: {
    flexGrow: 1,
    color: "#A9A9A9",
  },
  taskTitle: {
    marginBottom: "5px",
    fontSize: "1.4em",
    fontWeight: "bold",
  },
  tagPill: {
    fontSize: "0.8em",
    padding: "4px 8px",
    borderRadius: "10px",
    display: "inline-block",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: "5px",
  },
  taskActions: {
    display: "flex",
    gap: "8px",
  },
  actionButton: {
    padding: "10px",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "18px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    editColor: "#f39c12",
    deleteColor: DANGER_COLOR,
    completeColor: SUCCESS_COLOR,
    resetColor: "#e67e22",
  },
  error: {
    color: SECONDARY_COLOR,
    backgroundColor: DANGER_COLOR,
    padding: "10px",
    borderRadius: "8px",
    textAlign: "center",
    fontWeight: "bold",
    boxShadow: `inset 0 0 5px rgba(0,0,0,0.5)`,
  },
};

// ==========================================================
// COMPONENTE PRINCIPAL
// ==========================================================
export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. LEITURA (GET)
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Task[]>(API_URL);
      setTasks(response.data.map((t: Task) => ({ ...t, tag: t.tag || "Geral" })));
    } catch (err) {
      setError("Erro ao buscar as tarefas. Verifique se o json-server está rodando (npm run server).");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.backgroundColor = styles.bodyBg;
    document.body.style.color = styles.textColor;
    fetchTasks();
  }, []);

  // Resetar formulário
  const clearForm = () => {
    setTitle("");
    setDescription("");
    setTag("");
    setEditingTask(null);
  };

  // 2. CRIAÇÃO (POST)
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return alert("Título e descrição são obrigatórios.");
    const newTask: Omit<Task, "id"> = { title, description, completed: false, tag: tag || "Geral" };
    try {
      const response = await axios.post<Task>(API_URL, newTask);
      setTasks([...tasks, response.data]);
      clearForm();
    } catch (err) {
      setError("Erro ao adicionar a tarefa.");
      console.error(err);
    }
  };

  // 3. EXCLUSÃO (DELETE)
  const deleteTask = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTasks(tasks.filter((task) => task.id !== id));
    } catch (err) {
      setError("Erro ao excluir a tarefa.");
      console.error(err);
    }
  };

  // 4. TOGGLE COMPLETED (PATCH)
  const toggleCompleted = async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    try {
      await axios.patch(`${API_URL}/${task.id}`, { completed: updatedTask.completed });
      setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
    } catch (err) {
      setError("Erro ao atualizar o status da tarefa.");
      console.error(err);
    }
  };

  // 5. EDITAR (PUT)
  const startEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setTag(task.tag || "");
  };

  const cancelEdit = () => {
    clearForm();
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return alert("Título e descrição são obrigatórios.");

    const updatedTaskData: Task = {
      ...editingTask!,
      title,
      description,
      tag: tag || "Geral",
    };

    try {
      await axios.put(`${API_URL}/${editingTask!.id}`, updatedTaskData);
      setTasks(tasks.map((t) => (t.id === editingTask!.id ? updatedTaskData : t)));
      clearForm();
    } catch (err) {
      setError("Erro ao salvar a edição da tarefa.");
      console.error(err);
    }
  };

  // Render
  return (
    <div style={styles.container}>
      <h1 style={styles.header}>{APP_NAME}</h1>
      {error && <p style={styles.error}>{error}</p>}

      {/* Formulário */}
      <form onSubmit={editingTask ? saveEdit : addTask} style={styles.form}>
        <h2 style={{ color: styles.textColor }}>
          {editingTask ? "✏️ Editar Tarefa" : "➕ Adicionar Nova Tarefa"}
        </h2>
        <input type="text" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} required style={styles.input} />
        <input type="text" placeholder="Categoria (Ex: Trabalho, Pessoal, Urgente)" value={tag} onChange={(e) => setTag(e.target.value)} style={styles.input} />
        <textarea placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} required style={styles.textarea} />
        <div style={styles.formButtons}>
          <button type="submit" style={styles.submitButton}>
            {editingTask ? "Salvar Edição" : "Adicionar Tarefa"}
          </button>
          {editingTask && (
            <button type="button" onClick={cancelEdit} style={styles.cancelButton}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <hr style={styles.hr} />

      {/* Lista */}
      {loading ? (
        <p style={{ textAlign: "center", color: styles.textColor }}>Carregando tarefas...</p>
      ) : (
        <ul style={styles.list}>
          {tasks.length === 0 && <p style={{ textAlign: "center", color: styles.taskContent.color }}>Nenhuma tarefa encontrada. Adicione uma nova!</p>}
          {tasks.map((task) => {
            const tagStyle = getTagStyle(task.tag);
            return (
              <li
                key={task.id}
                style={{
                  ...styles.listItem,
                  borderLeft: `5px solid ${task.completed ? styles.completedBorder : tagStyle.borderColor}`,
                }}
              >
                <div style={styles.taskContent}>
                  <h3 style={{ ...styles.taskTitle, color: task.completed ? styles.completedColor : tagStyle.textColor }}>
                    {task.title}
                  </h3>
                  <span style={{ ...styles.tagPill, backgroundColor: tagStyle.backgroundColor, color: tagStyle.textColor, boxShadow: tagStyle.boxShadow }}>
                    {task.tag || "Geral"}
                  </span>
                  <p style={{ color: styles.taskContent.color, marginTop: "8px" }}>{task.description}</p>
                  <small style={{ color: task.completed ? styles.completedColor : tagStyle.textColor, fontWeight: "bold" }}>
                    Status: {task.completed ? "✅ CONCLUÍDA" : "⏳ PENDENTE"}
                  </small>
                </div>
                <div style={styles.taskActions}>
                  <button onClick={() => toggleCompleted(task)} style={{ ...styles.actionButton, backgroundColor: task.completed ? styles.actionButton.resetColor : styles.actionButton.completeColor }}>
                    {task.completed ? "⏪" : "✅"}
                  </button>
                  <button onClick={() => startEdit(task)} style={{ ...styles.actionButton, backgroundColor: styles.actionButton.editColor }}>
                    ✏️
                  </button>
                  <button onClick={() => deleteTask(task.id)} style={{ ...styles.actionButton, backgroundColor: styles.actionButton.deleteColor }}>
                    🗑️
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}