import { useState } from 'react'
import './App.css'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './Components/HomePage'
import CodingInterface from './Components/CodingInterface'
import { useEffect } from 'react'
import { socket } from './socket'

import {ToastContainer} from "react-toastify"
import "react-toastify/ReactToastify.css"

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
        <ToastContainer position='top-center' newestOnTop autoClose={1500} />
        <RouterProvider router={router}/>
    </>
  )
}

export default App
