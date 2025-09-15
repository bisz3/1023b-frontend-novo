import './App.css'
import { useEffect, useState } from 'react'

type ProdutoType = {
  id: number
  nome: string
  preco: number
  descricao: string
  urlfoto: string
}

function App() {
  const [produtos, setProdutos] = useState<ProdutoType[]>([])

  useEffect(() => {
    fetch('/api/produtos')
      .then((response) => response.json())
      .then((data) => setProdutos(data))
  }, [])

  return (
    <>
      <div>HAHAHAHAHA</div>
      {produtos.map((produto) => (
        <div key={produto.id}>
          <h2>{produto.nome}</h2>
          <p>{produto.descricao}</p>
          <p>R$ {produto.preco.toFixed(2)}</p>
          <img src={produto.urlfoto} alt={produto.nome} width="200" />
        </div>
      ))}
    </>
  )
}

export default App