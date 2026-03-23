import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import http from "http"
import {Server} from "socket.io"

dotenv.config()

const app=express()
app.use(cors({
    origin:process.env.CLIENT_URL
}))

app.use(express.json())

const server=http.createServer(app)

const io=new Server(server,{
    cors:{
        origin:process.env.CLIENT_URL
    }
})

io.on("connection",(socket)=>{
    console.log(`User connected: ${socket.id}`)
    
    socket.on("disconnect",()=>{
        console.log(`User disconnected: ${socket.id}`)
    })
})

const PORT=process.env.PORT || 5000
server.listen(PORT,()=>{
    console.log(`Server running on PORT: ${PORT}`)
})