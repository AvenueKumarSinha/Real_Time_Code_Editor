import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import http from "http"
import {Server} from "socket.io"
import axios from "axios"
import e from "express"

import { LANGUAGE_ID } from "../constants.js"

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
const rooms={}; // {rooms1:[{socketID,username}]}
const socketToRoom = {};
const socketToUsername={};

io.on("connection",(socket)=>{    
    console.log(`User connected: ${socket.id}`)
    socket.on("disconnect",()=>{
        console.log(`User disconnected: ${socket.id}`)

        const room = socketToRoom[socket.id];
        if(!room) return;
        
        const username=socketToUsername[socket.id];
        io.to(room).emit("user-disconnected",username)

        rooms[room]=rooms[room].filter(
            (user)=>user.socketId !==socket.id
        );
        delete socketToRoom[socket.id];
        delete socketToUsername[socket.id];

        if(rooms[room].length===0) delete rooms[room];
        else io.to(room).emit("users-update",rooms[room])

    })

    socket.on("join-room",async({room,username})=>{
        const duplicateUsername=checkDuplicateUsername(room,username);
        if(duplicateUsername){
            socket.emit("duplicate-username");
            return;
        }

        socket.join(room)
        
        socketToRoom[socket.id] = room;
        socketToUsername[socket.id]=username;

        if(!rooms[room]) rooms[room]=[]
        rooms[room].push({
            socketId:socket.id,
            username
        })

        io.to(room).emit("users-update",rooms[room])
        io.to(room).emit("user-connected",username)

        if(roomState[room]) 
            socket.emit("sync-state",roomState[room]);

    })

    socket.on("leave-room",async()=>{
        console.log(`User disconnected: ${socket.id}`)

        const room = socketToRoom[socket.id];
        if(!room) return;
        
        const username=socketToUsername[socket.id];
        io.to(room).emit("user-disconnected",username)

        rooms[room]=rooms[room].filter(
            (user)=>user.socketId !==socket.id
        );
        delete socketToRoom[socket.id];
        delete socketToUsername[socket.id];

        if(rooms[room].length===0) delete rooms[room];
        else io.to(room).emit("users-update",rooms[room])
    })
    
    socket.on("send-code",({room,code,language})=>{
        if(!roomState[room]) roomState[room]={};
            roomState[room].code=code;
            roomState[room].language=language;
            socket.to(room).emit("receive-code",code);
    })

    socket.on("change-language",({room,language,code})=>{
        roomState[room]={language,code};
        socket.to(room).emit("sync-state",{language,code});
    })
})

const encode=(str)=>{
    return Buffer.from(str).toString("base64");
}

const decode=(str)=>{
    return str?Buffer.from(str,"base64").toString("utf-8"):"";
}

app.post("/run",async(req,res)=>{
    const {code,language,input}=req.body;
    try{
        const submission=await axios.post(
            "https://ce.judge0.com/submissions?base64_encoded=true&wait=false",
            {
                source_code:encode(code),
                language_id: Number(LANGUAGE_ID[language]),
                stdin:encode(input || "")
            }
        )

        const token=submission.data.token;

        let result;
        while(true){
            const res2=await axios.get(
                `https://ce.judge0.com/submissions/${token}?base64_encoded=true`
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
            output:decode(result.stdout),
            error:decode(result.stderr),
            compile_error: decode(result.compile_output),
            status: result.status.description
        });
    }catch(err){
        res.status(500).json({error:err.message})
    }
})

const checkDuplicateUsername=(room,username)=>{
    const duplicate =
            rooms[room]?.some(
                user => user.username === username
            ) || false;
    
    return duplicate;
}

app.post("/checkDuplicateUsername", (req, res) => {
    const { room, username } = req.body;

    const duplicate=checkDuplicateUsername(room,username);

    if (duplicate) {
        return res.status(400).json({
            duplicate: "true"
        });
    }

    return res.status(200).json({
        duplicate: "false"
    });
});

const checkRoom=(room)=>{
    return room in rooms;
}

app.post("/checkDuplicateRoom",(req,res)=>{
    const {room}=req.body;
    const duplicate=checkRoom(room);

    if(duplicate) return res.status(400).json({duplicate:"true"});
    return res.status(200).json({duplicate:"false"});
});

app.post("/checkRoomExists",(req,res)=>{
    const {room}=req.body;
    const exists=checkRoom(room);

    if(exists) return res.status(200).json({exists:"true"});
    return res.status(400).json({exists:"false"});
});

const PORT=process.env.PORT || 5000
server.listen(PORT,()=>{
    console.log(`Server running on PORT: ${PORT}`)
})