import { useState } from 'react'
import './App.css'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './Components/HomePage'
import CodingInterface from './Components/CodingInterface'
import { useEffect } from 'react'
import { socket } from './socket'

function App() {
  useEffect(()=>{
    socket.connect();

    return ()=>{
      socket.disconnect();
    }
  },[])

  const router=createBrowserRouter([
    {
      path:"/",
      element:<HomePage/>
    },
    {
      path:"/code",
      element:<CodingInterface/>
    }
  ])

  return (
    <>
      <RouterProvider router={router}/>
    </>
  )
}

export default App
