import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import http from "http"
import {Server} from "socket.io"
import axios from "axios"
import e from "express"

import { LANGUAGE_ID } from "../constants.js"
import { settings } from "cluster"

import { GoogleGenAI } from "@google/genai"

dotenv.config()

const app=express()
app.use(cors({
    origin:process.env.CLIENT_URL,
    credentials:true
}))

app.use(express.json())

const server=http.createServer(app)

const io=new Server(server,{
    cors:{
        origin:process.env.CLIENT_URL,
        credentials:true
    }
})

const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY})
const ai_model=process.env.AI_MODEL;

const roomState = {}; // { roomId: { code, language } }
const rooms={}; // {roomsid:{mode,users:[socketid,username,admin],settings:{language:false,...},chats:[]}
const socketToRoom = {};
const socketToUsername={};

io.on("connection",(socket)=>{    
    console.log(`User connected: ${socket.id}`)
    socket.on("disconnect",()=>{
        console.log(`User disconnected: ${socket.id}`)

        const room = socketToRoom[socket.id];
        if(!room) return;
        
        const username=socketToUsername[socket.id];

        if(rooms[room].mode==="admin" && isAdmin(room,socket.id) && rooms[room].users.length>1){
            const room=socketToRoom[socket.id];
            if(!room) return;

            io.to(room).emit("room-closed");

            rooms[room].users.forEach(user => {
                delete socketToRoom[user.socketId];
                delete socketToUsername[user.socketId];
            });

            delete rooms[room];

            return;
        }

        io.to(room).emit("user-disconnected",username)

        rooms[room].users=rooms[room].users.filter(
            (user)=>user.socketId !==socket.id
        );
        delete socketToRoom[socket.id];
        delete socketToUsername[socket.id];

        if(rooms[room].users.length===0) delete rooms[room];
        else io.to(room).emit("users-update",rooms[room].users)

    })

    socket.on("join-room",async({room,username,roomMode},callback)=>{
        if(rooms[room] && rooms[room].mode==="admin" && rooms[room].settings.roomLock) 
            return callback({success: false, roomLock:true});
            

        const duplicateUsername=checkDuplicateUsername(room,username);
        if(duplicateUsername){
            socket.emit("duplicate-username");
            return;
        }

        socket.join(room)
        
        socketToRoom[socket.id] = room;
        socketToUsername[socket.id]=username;

        if(!rooms[room]){
            rooms[room]={
                mode: roomMode,
                users: [],
                settings: {
                    language:false,
                    reset:false,
                    roomLock:false,
                    chatEnable:true,
                    chatHistory:true
                },
                chats: []
            };

            rooms[room].users.push({
                socketId: socket.id,
                username,
                admin: roomMode === "admin"
            });
        }else{
            rooms[room].users.push({
                socketId: socket.id,
                username,
                admin: false
            });
        }
        
        const currentUser = rooms[room].users.find(user => user.socketId === socket.id);

        socket.emit("joined-room",{
            admin:currentUser.admin,
            roomMode:rooms[room].mode,
            settings:rooms[room].settings
        });

        if(rooms[room].mode==="open" || rooms[room].settings.chatHistory)
            io.to(room).emit("chat-history",rooms[room].chats);

        io.to(room).emit("users-update",rooms[room].users);

        io.to(room).emit("user-connected",username);

        if (roomState[room]) socket.emit("sync-state",roomState[room]);

        return callback({success:true,roomLock:false});

    })

    socket.on("leave-room",async()=>{
        console.log(`User disconnected: ${socket.id}`)

        const room = socketToRoom[socket.id];
        if(!room) return;
        
        const username=socketToUsername[socket.id];
        io.to(room).emit("user-disconnected",username)

        rooms[room].users=rooms[room].users.filter(
            (user)=>user.socketId !==socket.id
        );
        delete socketToRoom[socket.id];
        delete socketToUsername[socket.id];

        if(rooms[room].users.length===0) delete rooms[room];
        else io.to(room).emit("users-update",rooms[room].users)
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
        const usernameThatChangedTheLanguage=socketToUsername[socket.id];
        socket.to(room).emit("toast-change-language",{language,usernameThatChangedTheLanguage});
    })

    socket.on("reset-code",({room})=>{
        const usernameThatChangedTheLanguage=socketToUsername[socket.id];
        socket.to(room).emit("toast-reset-code",{usernameThatChangedTheLanguage});
    })

    socket.on("kick-user",({room,targetSocketId},callback)=>{
        if(rooms[room]?.mode!=="admin") return;

        if(!isAdmin(room, socket.id)){
            socket.emit("not-admin");
            return;
        }

        const targetUser = getUserBySocketId(room,targetSocketId);

        if (!targetUser) return callback({
            success:false
        });

        if(targetUser.admin) return callback({
            success:false
        });

        callback({success:true})

        io.to(targetSocketId).emit("kicked",{room,kickedBy:socketToUsername[socket.id]});

        const targetSocket =io.sockets.sockets.get(targetSocketId);

        if (targetSocket) targetSocket.leave(room);
        
        rooms[room].users = rooms[room].users.filter(user => user.socketId !== targetSocketId);
        delete socketToRoom[targetSocketId];

        io.to(room).emit("kick-update",{kickedBy:socketToUsername[socket.id],kicked:socketToUsername[targetSocketId]})

        delete socketToUsername[targetSocketId];

        io.to(room).emit("users-update",rooms[room].users);
    });

    socket.on("admin-left",()=>{
        const room=socketToRoom[socket.id];
        if(!room) return;

        io.to(room).emit("room-closed");

        rooms[room].users.forEach(user => {
            delete socketToRoom[user.socketId];
            delete socketToUsername[user.socketId];
        });

        delete rooms[room];
    })

    socket.on("update-settings-server",({language,reset,roomLock,chatEnable,chatHistory},callback)=>{
        const room=socketToRoom[socket.id];
        if(!room) return callback({success:false, admin:false});

        if(isAdminMode(room) && !isAdmin(room,socket.id)){
            socket.emit("not-admin");
            return callback({success:false, admin:true});
        }

        rooms[room].settings.language=language;
        rooms[room].settings.reset=reset;
        rooms[room].settings.roomLock=roomLock;
        rooms[room].settings.chatEnable=chatEnable;
        rooms[room].settings.chatHistory=chatHistory;

        io.to(room).emit("update-settings",rooms[room].settings);
        return callback({success:true});
    })

    socket.on("send-chat",({message})=>{
        const room=socketToRoom[socket.id];
        if(!rooms[room]) return;

        if(rooms[room].mode==="admin" && !rooms[room].settings.chatEnable) return;

        const chat={
            username: socketToUsername[socket.id],
            message:message,
            timestamp: Date.now()
        };

        rooms[room].chats.push(chat);

        io.to(room).emit("receive-chat",chat);
    })

    socket.on("send-prompt", async({prompt}, callback)=>{
        try{
            const response= await ai.models.generateContent({
                model: ai_model,
                contents: prompt
            })

            const answer=response.text;
            const timestamp=Date.now();

            io.to(socket.id).emit("receive-ai-prompt", {prompt: prompt, timestamp: timestamp})
            io.to(socket.id).emit("receive-ai-answer", {answer: answer, timestamp: timestamp})

            return callback({error:false, answer: answer})
        }catch(err){
            return callback({error: true})
        }
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
            rooms[room]?.users.some(
                user => user.username === username
            ) || false;
    
    return duplicate;
}

const isAdmin=(room,socketId)=>{
  return (rooms[room]?.users.find(user =>user.socketId ===socketId)?.admin === true);
};

const isAdminMode=(room)=>{
    return rooms[room]?.mode ==="admin"
};

const getUserBySocketId =(room, socketId)=>{
    return rooms[room]?.users.find(user => user.socketId === socketId);
};

const userExists = (room, username) => {
    return rooms[room]?.users.some(user => user.username === username) || false;
};

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