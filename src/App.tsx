import { useState, useEffect } from 'react';
import './App.css';
import { formatarMoeda } from './utils/formatadores';
import { fetchCarrinho, adicionarAoCarrinho, removerDoCarrinho } from './services/api';

interface Usuario {
  _id: string;
  nome: string;
  email: string;
}

interface LoginFormData {
  email: string;
  senha: string;
}

interface CadastroFormData extends LoginFormData {
  nome: string;
  confirmarSenha: string;
}

interface ProdutoType {
  _id: string;
  nome: string;
  preco: number;
  urlfoto: string;
  descricao: string;
}

interface ItemCarrinho {
  _id: string;
  produto: ProdutoType;
  quantidade: number;
  criadoEm: string;
}

interface ProdutoFormProps {
  onProdutoCadastrado: () => void;
}

const ProdutoForm: React.FC<ProdutoFormProps> = ({ onProdutoCadastrado }) => {
  const [formData, setFormData] = useState<Omit<ProdutoType, 'id' | '_id'>>({
    nome: '',
    preco: 0,
    urlfoto: '',
    descricao: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'preco' ? parseFloat(value) || 0 : value
    }));
  };

  const handleForm = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Erro ao cadastrar produto');
      }

      // Limpar o formulário
      setFormData({
        nome: '',
        preco: 0,
        urlfoto: '',
        descricao: ''
      });

      // Notificar o componente pai para atualizar a lista
      onProdutoCadastrado();
      alert('Produto cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao cadastrar produto. Por favor, tente novamente.');
    }
  };

  return (
    <form onSubmit={handleForm} className="produto-form">
      <div className="form-group">
        <label>Nome:</label>
        <input
          type="text"
          name="nome"
          value={formData.nome}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Preço:</label>
        <input
          type="number"
          name="preco"
          value={formData.preco || ''}
          onChange={handleInputChange}
          step="0.01"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label>URL da Imagem:</label>
        <input
          type="url"
          name="urlfoto"
          value={formData.urlfoto}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Descrição:</label>
        <textarea
          name="descricao"
          value={formData.descricao}
          onChange={handleInputChange}
          required
        />
      </div>

      <button type="submit" className="botao-cadastrar">
        Cadastrar Produto
      </button>
    </form>
  );
};

function App() {
  const [produtos, setProdutos] = useState<ProdutoType[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [mostrarLogin, setMostrarLogin] = useState(true); // Alternar entre login e cadastro
  const [erro, setErro] = useState('');

  // Estado para os formulários
  const [loginForm, setLoginForm] = useState<LoginFormData>({
    email: '',
    senha: ''
  });

  const [cadastroForm, setCadastroForm] = useState<CadastroFormData>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });

  // Verifica se tem usuário logado ao carregar a aplicação
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    } else {
      // Se não houver usuário, para de carregar para mostrar a tela de login
      setCarregando(false);
    }
  }, []);

  // Efeito para carregar os dados quando o usuário estiver logado
  useEffect(() => {
    if (usuario) {
      carregarDados();
    } else {
      // Limpa os dados quando deslogar
      setProdutos([]);
      setCarrinho([]);
    }
  }, [usuario]);

  const carregarDados = async () => {
    if (!usuario) return;
    
    try {
      setCarregando(true);
      setErro('');
      
      const [responseProdutos, carrinhoData] = await Promise.all([
        fetch('/api/produtos'),
        fetchCarrinho()
      ]);
      
      if (!responseProdutos.ok) throw new Error('Erro ao carregar produtos');
      
      const produtosData = await responseProdutos.json();
      setProdutos(produtosData);
      setCarrinho(carrinhoData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro('Erro ao carregar os dados. Tente novamente.');
      // Se houver erro de autenticação, faz logout
      if (error instanceof Error && error.message.includes('autenticação')) {
        handleLogout();
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    
    try {
      setCarregando(true);
      const response = await fetch('/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          senha: loginForm.senha
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Credenciais inválidas');
      }

      const data = await response.json();
      
      // Atualiza o estado do usuário
      setUsuario(data.usuario);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      
      // Limpa o formulário
      setLoginForm({
        email: '',
        senha: ''
      });
      
    } catch (error) {
      console.error('Erro no login:', error);
      setErro(error instanceof Error ? error.message : 'Falha no login. Verifique suas credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (cadastroForm.senha !== cadastroForm.confirmarSenha) {
      setErro('As senhas não coincidem');
      return;
    }

    try {
      setCarregando(true);
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: cadastroForm.nome,
          email: cadastroForm.email,
          senha: cadastroForm.senha
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cadastrar');
      }

      const data = await response.json();
      
      // Atualiza o estado do usuário sem chamar handleLogin
      setUsuario(data.usuario);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      
      // Reseta o formulário
      setCadastroForm({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: ''
      });
      
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao cadastrar usuário');
    } finally {
      setCarregando(false);
    }
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  const handleAdicionarAoCarrinho = async (produtoId: string) => {
    try {
      await adicionarAoCarrinho(produtoId);
      const novoCarrinho = await fetchCarrinho();
      setCarrinho(novoCarrinho);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    }
  };

  const handleRemoverDoCarrinho = async (itemId: string) => {
    try {
      await removerDoCarrinho(itemId);
      const novoCarrinho = await fetchCarrinho();
      setCarrinho(novoCarrinho);
    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
    }
  };

  // Função para ser chamada após cadastrar um novo produto
  const handleProdutoCadastrado = async () => {
    try {
      const response = await fetch('/api/produtos');
      if (!response.ok) throw new Error('Erro ao carregar produtos');
      const data = await response.json();
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setErro('Erro ao carregar a lista de produtos');
    }
  };

  // Se não estiver autenticado, mostrar formulário de login/cadastro
  if (!usuario) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-tabs">
            <button 
              className={`tab ${mostrarLogin ? 'active' : ''}`}
              onClick={() => setMostrarLogin(true)}
            >
              Entrar
            </button>
            <button 
              className={`tab ${!mostrarLogin ? 'active' : ''}`}
              onClick={() => setMostrarLogin(false)}
            >
              Cadastrar
            </button>
          </div>

          {erro && <div className="erro">{erro}</div>}

          {mostrarLogin ? (
            <form onSubmit={handleLogin} className="auth-form">
              <h2>Entrar na Conta</h2>
              <input
                type="email"
                placeholder="E-mail"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={loginForm.senha}
                onChange={(e) => setLoginForm({...loginForm, senha: e.target.value})}
                required
              />
              <button type="submit" disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCadastro} className="auth-form">
              <h2>Criar Conta</h2>
              <input
                type="text"
                placeholder="Nome completo"
                value={cadastroForm.nome}
                onChange={(e) => setCadastroForm({...cadastroForm, nome: e.target.value})}
                required
              />
              <input
                type="email"
                placeholder="E-mail"
                value={cadastroForm.email}
                onChange={(e) => setCadastroForm({...cadastroForm, email: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={cadastroForm.senha}
                onChange={(e) => setCadastroForm({...cadastroForm, senha: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Confirme a senha"
                value={cadastroForm.confirmarSenha}
                onChange={(e) => setCadastroForm({...cadastroForm, confirmarSenha: e.target.value})}
                required
              />
              <button type="submit" disabled={carregando}>
                {carregando ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (carregando) {
    return <div>Carregando...</div>;
  }

  const total = carrinho.reduce(
    (soma, item) => soma + (item.produto ? item.produto.preco * item.quantidade : 0),
    0
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Loja Online</h1>
        <div className="user-info">
          <span>Olá, {usuario.nome}</span>
          <button onClick={handleLogout} className="btn-sair">Sair</button>
        </div>
      </header>

      <div className="conteudo-principal">
        <section className="cadastro-produto">
          <h2>Cadastro de Produto</h2>
          <ProdutoForm onProdutoCadastrado={handleProdutoCadastrado} />
        </section>


        <section className="lista-produtos">
          <h2>Produtos Disponíveis</h2>
          <div className="grade-produtos">
            {produtos.map(produto => (
              <div key={produto._id} className="produto-card">
                <img src={produto.urlfoto} alt={produto.nome} />
                <h3>{produto.nome}</h3>
                <p>{produto.descricao}</p>
                <p>{formatarMoeda(produto.preco)}</p>
                <button
                  onClick={() => handleAdicionarAoCarrinho(produto._id)}
                  className="btn-adicionar"
                >
                  Adicionar ao Carrinho
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className="carrinho">
          <h2>Seu Carrinho</h2>
          {carrinho.length === 0 ? (
            <p>Seu carrinho está vazio</p>
          ) : (
            <div className="itens-carrinho">
              {carrinho.map(item => (
                <div key={item._id} className="item-carrinho">
                  <img src={item.produto.urlfoto} alt={item.produto.nome} />
                  <div>
                    <h4>{item.produto.nome}</h4>
                    <p>{item.quantidade} x {formatarMoeda(item.produto.preco)}</p>
                  </div>
                  <button
                    onClick={() => handleRemoverDoCarrinho(item._id)}
                    className="btn-remover"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <div className="total-carrinho">
                <strong>Total: {formatarMoeda(total)}</strong>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;