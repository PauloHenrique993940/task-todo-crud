// pages/index.js (ou .jsx)
import { useState, useEffect } from 'react';
import axios from 'axios';

// URL base da nossa API
const API_URL = 'http://localhost:3001/tasks';
// Nome do App
const APP_NAME = "TaskFlow 3D | Categorias";

// Componente principal da aplicação
export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  // NOVO: Adicionamos o estado para a Tag (Categoria)
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. LEITURA (GET)
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL);
      // Garante que a tag exista (para tarefas antigas sem tag)
      setTasks(response.data.map(t => ({ ...t, tag: t.tag || 'Geral' })));
    } catch (err) {
      setError('Erro ao buscar as tarefas. Verifique se o json-server está rodando (npm run server).');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Configura o fundo do corpo da página para o tema escuro
    document.body.style.backgroundColor = styles.bodyBg;
    document.body.style.color = styles.textColor;

    fetchTasks();
  }, []);

  // Função auxiliar para resetar os campos
  const clearForm = () => {
    setTitle('');
    setDescription('');
    setTag('');
    setEditingTask(null);
  };

  // 2. CRIAÇÃO (POST)
  const addTask = async (e) => {
    e.preventDefault();
    if (!title || !description) return alert('Título e descrição são obrigatórios.');

    // NOVO: Inclui a tag na nova tarefa
    const newTask = { title, description, completed: false, tag: tag || 'Geral' };
    try {
      const response = await axios.post(API_URL, newTask);
      setTasks([...tasks, response.data]);
      clearForm();
    } catch (err) {
      setError('Erro ao adicionar a tarefa.');
      console.error(err);
    }
  };

  // ... (deleteTask e toggleCompleted não mudam a lógica)
  // 3. EXCLUSÃO (DELETE)
  const deleteTask = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      setError('Erro ao excluir a tarefa.');
      console.error(err);
    }
  };

  // 4. ATUALIZAÇÃO - MARCAR COMO CONCLUÍDO (PATCH)
  const toggleCompleted = async (task) => {
    const updatedTask = { ...task, completed: !task.completed };
    try {
      await axios.patch(`${API_URL}/${task.id}`, { completed: updatedTask.completed });

      setTasks(tasks.map(t =>
        t.id === task.id ? updatedTask : t
      ));
    } catch (err) {
      setError('Erro ao atualizar o status da tarefa.');
      console.error(err);
    }
  };


  // 5. ATUALIZAÇÃO COMPLETA (PUT) - Lógica de Edição
  const startEdit = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    // NOVO: Carrega a tag ao iniciar a edição
    setTag(task.tag || '');
  };

  const cancelEdit = () => {
    clearForm();
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!title || !description) return alert('Título e descrição são obrigatórios.');

    const updatedTaskData = {
      ...editingTask,
      title,
      description,
      // NOVO: Salva a nova tag
      tag: tag || 'Geral'
    };

    try {
      await axios.put(`${API_URL}/${editingTask.id}`, updatedTaskData);

      setTasks(tasks.map(t =>
        t.id === editingTask.id ? updatedTaskData : t
      ));
      clearForm(); // Limpa o formulário de edição
    } catch (err) {
      setError('Erro ao salvar a edição da tarefa.');
      console.error(err);
    }
  };

  // --- RENDERIZAÇÃO DA UI ---
  return (
    <div style={styles.container}>
      <h1 style={styles.header}>{APP_NAME}</h1>

      {/* Exibe o erro */}
      {error && <p style={styles.error}>{error}</p>}

      {/* Formulário de Adição/Edição */}
      <form onSubmit={editingTask ? saveEdit : addTask} style={styles.form}>
        <h2 style={{ color: styles.textColor }}>{editingTask ? '✏️ Editar Tarefa' : '➕ Adicionar Nova Tarefa'}</h2>
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={styles.input}
        />
        {/* NOVO: Campo de Categoria (Tag) */}
        <input
          type="text"
          placeholder="Categoria (Ex: Trabalho, Pessoal, Urgente)"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          style={styles.input}
        />
        <textarea
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={styles.textarea}
        />
        <div style={styles.formButtons}>
          <button type="submit" style={styles.submitButton}>
            {editingTask ? 'Salvar Edição' : 'Adicionar Tarefa'}
          </button>
          {editingTask && (
            <button type="button" onClick={cancelEdit} style={styles.cancelButton}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <hr style={styles.hr} />

      {/* Lista de Tarefas */}
      {loading ? (
        <p style={{ textAlign: 'center', color: styles.textColor }}>Carregando tarefas...</p>
      ) : (
        <ul style={styles.list}>
          {tasks.length === 0 && <p style={{ textAlign: 'center', color: styles.taskContent.color }}>Nenhuma tarefa encontrada. Adicione uma nova!</p>}
          {tasks.map((task) => {
            // Obtém as cores da categoria (tag)
            const tagStyle = getTagStyle(task.tag);

            return (
              <li
                key={task.id}
                style={{
                  ...styles.listItem,
                  backgroundColor: styles.cardBgColor,
                  // Aplica a cor da tag OU cor de concluído/pendente
                  borderLeft: `5px solid ${task.completed ? styles.completedBorder : tagStyle.borderColor}`,
                  boxShadow: task.completed ? styles.listItem.completedShadow : styles.listItem.boxShadow,
                }}
              >
                <div style={styles.taskContent}>
                  <h3 style={{
                    ...styles.taskTitle,
                    // Cor do título baseada na tag OU concluído
                    color: task.completed ? styles.completedColor : tagStyle.textColor
                  }}>
                    {task.title}
                  </h3>
                  {/* NOVO: Exibe a Tag */}
                  <span style={{
                    ...styles.tagPill,
                    backgroundColor: tagStyle.backgroundColor,
                    color: tagStyle.textColor,
                    boxShadow: tagStyle.boxShadow
                  }}
                  >
                    {task.tag || 'Geral'}
                  </span>
                  <p style={{ color: styles.taskContent.color, marginTop: '8px' }}>{task.description}</p>
                  <small style={{
                    color: task.completed ? styles.completedColor : tagStyle.textColor,
                    fontWeight: 'bold'
                  }}>
                    Status: {task.completed ? '✅ CONCLUÍDA' : '⏳ PENDENTE'}
                  </small>
                </div>

                <div style={styles.taskActions}>
                  <button
                    onClick={() => toggleCompleted(task)}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: task.completed ? styles.actionButton.resetColor : styles.actionButton.completeColor
                    }}
                    title={task.completed ? 'Marcar como Pendente' : 'Marcar como Concluída'}
                  >
                    {task.completed ? '⏪' : '✅'}
                  </button>
                  <button
                    onClick={() => startEdit(task)}
                    style={{ ...styles.actionButton, backgroundColor: styles.actionButton.editColor }}
                    title="Editar Tarefa"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    style={{ ...styles.actionButton, backgroundColor: styles.actionButton.deleteColor }}
                    title="Excluir Tarefa"
                  >
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

// ==========================================================
// FUNÇÃO PARA ESTILOS DE CATEGORIA (TAG)
// ==========================================================
const getTagStyle = (tag) => {
  const normalizedTag = (tag || 'Geral').toLowerCase().trim();
  let colorMap = {};

  switch (normalizedTag) {
    case 'trabalho':
      colorMap = { primary: '#FF5733', secondary: '#FFD700' }; // Laranja Fogo
      break;
    case 'pessoal':
      colorMap = { primary: '#3399FF', secondary: '#E0FFFF' }; // Azul Claro
      break;
    case 'urgente':
    case 'bug':
      colorMap = { primary: '#FF33A1', secondary: '#F08080' }; // Rosa Neon
      break;
    case 'estudo':
      colorMap = { primary: '#9933FF', secondary: '#DDA0DD' }; // Roxo
      break;
    default:
      colorMap = { primary: PRIMARY_COLOR, secondary: '#A9A9A9' }; // Ciano (Padrão)
  }

  return {
    borderColor: colorMap.primary,
    textColor: colorMap.primary,
    backgroundColor: `${colorMap.primary}30`, // Cor clara com transparência para o fundo do "tag pill"
    // Adiciona uma sombra sutil à pílula da tag para destaque
    boxShadow: `0 0 5px ${colorMap.primary}80`,
  };
};

// ==========================================================
// ESTILOS DARK MODE NEUMORFISMO (Efeito 3D)
// ==========================================================
const PRIMARY_COLOR = '#00ADB5'; // Ciano/Verde Água (Destaque)
const SECONDARY_COLOR = '#222831'; // Fundo mais escuro
const CARD_COLOR = '#393E46'; // Cor da superfície
const TEXT_COLOR = '#EEEEEE'; // Cor do texto

const DANGER_COLOR = '#e74c3c'; // Vermelho
const SUCCESS_COLOR = '#00C853'; // Verde

const styles = {
  // Cores Base do Neumorfismo
  bodyBg: SECONDARY_COLOR,
  cardBgColor: CARD_COLOR,
  textColor: TEXT_COLOR,

  // Cores Dinâmicas
  completedBorder: SUCCESS_COLOR,
  completedColor: SUCCESS_COLOR,
  // pendingBorder e pendingColor são definidos pela função getTagStyle agora!

  container: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '25px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: SECONDARY_COLOR,
    color: TEXT_COLOR,
    borderRadius: '20px',
    boxShadow: `12px 12px 24px #1d2228, -12px -12px 24px #475460`,
  },
  header: {
    textAlign: 'center',
    color: PRIMARY_COLOR,
    fontSize: '2.5em', // Maior destaque
    textShadow: `0 0 10px ${PRIMARY_COLOR}a0`, // Brilho mais forte
    marginBottom: '30px',
  },
  form: {
    padding: '25px', // Um pouco maior
    borderRadius: '15px',
    marginBottom: '30px',
    backgroundColor: CARD_COLOR,
    boxShadow: `inset 5px 5px 10px #2a2e34, inset -5px -5px 10px #484e58`,
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: 'none',
    borderRadius: '10px',
    boxSizing: 'border-box',
    backgroundColor: CARD_COLOR,
    color: TEXT_COLOR,
    boxShadow: `inset 3px 3px 6px #2a2e34, inset -3px -3px 6px #484e58`,
    '::placeholder': {
      color: '#A9A9A9'
    }
  },
  textarea: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    border: 'none',
    borderRadius: '10px',
    boxSizing: 'border-box',
    resize: 'vertical',
    backgroundColor: CARD_COLOR,
    color: TEXT_COLOR,
    boxShadow: `inset 3px 3px 6px #2a2e34, inset -3px -3px 6px #484e58`,
    '::placeholder': {
      color: '#A9A9A9'
    }
  },
  submitButton: {
    padding: '12px 20px',
    backgroundColor: PRIMARY_COLOR,
    color: SECONDARY_COLOR,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    marginRight: '10px',
    fontWeight: 'bold',
    boxShadow: `5px 5px 10px #1d2228, -5px -5px 10px #475460`,
    transition: 'background-color 0.2s, transform 0.1s',
    ':hover': {
      backgroundColor: '#00C7D0',
      boxShadow: `3px 3px 6px #1d2228, -3px -3px 6px #475460`,
    }
  },
  cancelButton: {
    padding: '12px 20px',
    backgroundColor: CARD_COLOR,
    color: TEXT_COLOR,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: `5px 5px 10px #1d2228, -5px -5px 10px #475460`,
    transition: 'background-color 0.2s',
  },
  formButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '10px',
  },
  hr: {
    border: '0',
    height: '1px',
    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0), ${PRIMARY_COLOR}, rgba(0, 0, 0, 0))`,
    margin: '30px 0',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px', // Mais padding
    marginBottom: '15px',
    borderRadius: '15px',
    backgroundColor: CARD_COLOR,
    boxShadow: `8px 8px 16px #1d2228, -8px -8px 16px #475460`,
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-3px)', // Sobe um pouco mais
      boxShadow: `12px 12px 24px #1d2228, -12px -12px 24px #475460`,
    },
    completedShadow: `8px 8px 16px #005020, -8px -8px 16px #008f3d`,
  },
  taskContent: {
    flexGrow: 1,
    color: '#A9A9A9',
  },
  taskTitle: {
    marginBottom: '5px',
    fontSize: '1.4em', // Título maior
    fontWeight: 'bold',
  },
  tagPill: {
    fontSize: '0.8em',
    padding: '4px 8px',
    borderRadius: '10px',
    display: 'inline-block',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: '5px',
  },
  taskActions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '10px',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '18px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `3px 3px 6px #1d2228, -3px -3px 6px #475460`,
    editColor: '#f39c12',
    deleteColor: DANGER_COLOR,
    completeColor: SUCCESS_COLOR,
    resetColor: '#e67e22',
    ':active': {
      boxShadow: `inset 2px 2px 4px #1d2228, inset -2px -2px 4px #475460`,
    }
  },
  error: {
    color: SECONDARY_COLOR,
    backgroundColor: DANGER_COLOR,
    padding: '10px',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: 'bold',
    boxShadow: `inset 0 0 5px rgba(0,0,0,0.5)`,
  }
};