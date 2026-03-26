import { useState } from 'react'
import './App.css'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './Components/HomePage'
import CodingInterface from './Components/CodingInterface'

function App() {
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
