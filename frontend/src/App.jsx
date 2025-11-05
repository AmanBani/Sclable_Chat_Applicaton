import { useState } from 'react'
import './App.css'
import axios  from 'axios';


const API = axios.create({
  baseURL: import.meta.env.BASE_URL
})

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1> Testing Endpoints</h1>

    </>
  )
}

export default App
