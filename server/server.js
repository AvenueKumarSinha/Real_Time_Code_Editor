import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import http from "http"
import {Server} from "socket.io"
import axios from "axios"
import e from "express"

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

const roomState = {}; // { roomId: { code, language } }

io.on("connection",(socket)=>{
    console.log(`User connected: ${socket.id}`)
    
    socket.on("disconnect",()=>{
        console.log(`User disconnected: ${socket.id}`)
    })

    socket.on("join-room",(room)=>{
        socket.join(room)
        if(roomState[room]) 
            socket.emit("sync-state",roomState[room]);
    })
    
    socket.on("send-code",({room,code})=>{
        if(!roomState[room]) roomState[room]={};
            roomState[room].code=code;
            socket.to(room).emit("receive-code",code);
    })

    socket.on("change-language",({room,language,code})=>{
        roomState[room]={language,code};
        socket.to(room).emit("sync-state",{language,code});
    })
})


app.post("/run",async(req,res)=>{
    const {code,language,input}=req.body;
    try{
        const submission=await axios.post(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=false",
            {
                source_code:code,
                language_id:language,
                stdin:input
            }
        )

        const token=submission.data.token;

        let result;
        while(true){
            const res2=await axios.get(
                `https://ce.judge0.com/submissions/${token}?base64_encoded=false`
            )

            if(res2.data.status.id<=2){
                //still processing
                await new Promise(r=>setTimeout(r,1000))
            }else{
                result=res2.data;
                break;
            }
        }

        res.json({
            output:result.stdout || "",
            error:result.stderr || "",
            compile_error: result.compile_output || "",
            status: result.status.description
        });
    }catch(err){
        console.log(err.response?.data);
        res.status(500).json({error:err.message})
    }
})

const PORT=process.env.PORT || 5000
server.listen(PORT,()=>{
    console.log(`Server running on PORT: ${PORT}`)
})