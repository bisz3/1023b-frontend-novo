import { useEffect, useState } from 'react'
import './App.css'

interface ProdutoType {
  id: number
  nome: string
  preco: number
  urlfoto: string
  descricao: string
}

function App() {
  const [produtos, setProdutos] = useState<ProdutoType[]>([])

  useEffect(() => {
    fetch('/api/produtos')
      .then(response => response.json())
      .then(data => setProdutos(data))
  }, [])

  const [formData, setFormData] = useState<Omit<ProdutoType, 'id'>>({ 
    nome: '',
    preco: 0,
    urlfoto: '',
    descricao: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Limpar o formulário após o envio
      setFormData({ 
        nome: '',
        preco: 0,
        urlfoto: '',
        descricao: ''
      });
      
      // Atualizar a lista de produtos
      const produtosResponse = await fetch('/api/produtos');
      const data = await produtosResponse.json();
      setProdutos(data);
      
      alert('Produto cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao cadastrar produto. Por favor, tente novamente.');
    }
  }

  return (
    <>
    <div>Cadastro de Produtos</div>
    <form onSubmit={handleForm} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', marginBottom: '20px' }}>
      <input 
        type="text" 
        name="nome" 
        placeholder="Nome"
        value={formData.nome}
        onChange={handleInputChange}
        required
      />
      <input 
        type="number" 
        name="preco" 
        placeholder="Preço"
        value={formData.preco || ''}
        onChange={handleInputChange}
        step="0.01"
        min="0"
        required
      />
      <input 
        type="url" 
        name="urlfoto" 
        placeholder="URL da imagem"
        value={formData.urlfoto}
        onChange={handleInputChange}
        required
      />
      <input 
        type="text" 
        name="descricao" 
        placeholder="Descrição"
        value={formData.descricao}
        onChange={handleInputChange}
        required
      />
      <button type="submit" style={{ padding: '8px', cursor: 'pointer' }}>Cadastrar</button>
    </form>
      <h1>Produtos</h1>
      <ul style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
        {produtos.map(produto => (
          <li key={produto.id} style={{ margin: '10px' }}>
            <img src={produto.urlfoto} alt={produto.nome} width={200} />
            <p>{produto.descricao}</p>
            <p>R$ {produto.preco}</p>
            <p>{produto.nome}</p>
            <button></button>
          </li>
        ))}
      </ul>
    </>
  )
}

export default App