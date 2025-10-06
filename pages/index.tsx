"use client";
import { useState, useEffect } from "react";
import axios from "axios";


// URL base da nossa API (ajuste conforme necessário)
const API_URL = "http://localhost:3001/tasks";
const APP_NAME = "TaskFlow 3D | Categorias";

// Definição do tipo da Tarefa
interface Task {
  id: number | string;
  title: string;
  description: string;
  completed: boolean;
  tag?: string;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar tarefas
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Task[]>(API_URL);
      setTasks(
        response.data.map((t: Task) => ({
          ...t,
          tag: t.tag || "Geral",
        }))
      );
    } catch (err) {
      setError("Erro ao buscar as tarefas. Verifique se o servidor está rodando.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Função para adicionar tarefa
  const addTask = async () => {
    if (!title) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      completed: false,
      tag: tag || "Geral",
    };
    try {
      await axios.post(API_URL, newTask);
      setTitle("");
      setDescription("");
      setTag("");
      fetchTasks();
    } catch (err) {
      console.error("Erro ao adicionar tarefa:", err);
    }
  };

  // Função para atualizar tarefa
  // pages/index.tsx (por volta da linha 75)

  // Função para atualizar tarefa
  const updateTask = async (task: Task) => {
    // A URL deve ser ex: http://localhost:3001/tasks/1701234567890
    const url = `${API_URL}/${task.id}`;

    // 💡 DEIXE ESTE LOG PARA VERIFICAR A SAÍDA NO CONSOLE
    console.log("URL de PUT que está falhando (404):", url);
    console.log("ID sendo enviado:", task.id);
    console.log("Tipo do ID:", typeof task.id);

    try {
      // LINHA 84
      await axios.put(url, task); // Use a variável 'url'       
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      // Imprime o erro completo para ver se há mais detalhes
      console.error("Erro ao atualizar tarefa (PUT falhou):", error);
      alert(`Erro ao salvar: Status 404. Verifique a URL: ${url} e se o json-server está rodando.`);
    }
  };
  // Função para deletar tarefa
  const deleteTask = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchTasks();
    } catch (err) {
      console.error("Erro ao deletar tarefa:", err);
    }
  };

  return (
    <main className="container">
      <h1 className="main-title">{APP_NAME}</h1>

      {/* Formulário */}
      <div className="form-group">
        <input
          className="input-field"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Categoria"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
        <button
          onClick={addTask}
          className="btn btn-add"
        >
          Adicionar
        </button>
      </div>

      {/* Lista de tarefas */}
      {loading && <p>Carregando...</p>}
      {error && <p className="error-message">{error}</p>}
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-item">
            <div>
              <strong>{task.title}</strong> - {task.description}{" "}
              <span className="task-tag">({task.tag})</span>
            </div>
            <div className="task-actions">
              <button
                onClick={() => deleteTask(task.id)}
                className="btn btn-delete"
              >
                Excluir
              </button>
              <button
                onClick={() => setEditingTask(task)}
                className="btn btn-edit"
              >
                Editar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Modal simples para edição */}
      {editingTask && (
        <div className="edit-modal">
          <h2 className="modal-title">Editar Tarefa</h2>
          <input
            className="input-field modal-input"
            value={editingTask.title}
            onChange={(e) =>
              setEditingTask({ ...editingTask, title: e.target.value })
            }
          />
          <input
            className="input-field modal-input"
            value={editingTask.description}
            onChange={(e) =>
              setEditingTask({ ...editingTask, description: e.target.value })
            }
          />
          <input
            className="input-field modal-input"
            value={editingTask.tag}
            onChange={(e) =>
              setEditingTask({ ...editingTask, tag: e.target.value })
            }
          />
          <button
            onClick={() => updateTask(editingTask)}
            className="btn btn-save"
          >
            Salvar
          </button>
        </div>
      )}
    </main>
  );
}