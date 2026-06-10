import React, { useState } from "react";
import { FaPlay } from "react-icons/fa";
import { IoCopy } from "react-icons/io5";
import Editor from "@monaco-editor/react";
import { FaArrowRotateRight } from "react-icons/fa6";
import { GiCancel } from "react-icons/gi";
import { MdLightMode } from "react-icons/md";
import { MdDarkMode } from "react-icons/md";

import { LANGUAGE,BOILERCODE } from "../../../constants";
import { useSearchParams } from "react-router-dom";
import { socket } from "../socket";
import { useRef } from "react";
import { useEffect } from "react";

import Loader from "./Loader";
import { toast } from "react-toastify";

import { NavLink,useNavigate } from "react-router-dom";

const CodingInterface = () => {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(BOILERCODE[language]);

  const [params]=useSearchParams()
  const username=params.get("username");
  const room=Number(params.get("room"))

  const isRemote=useRef(false);

  const [output,setOutput]=useState("You must run your code first")
  const [input,setInput]=useState("")
  const [error,setError]=useState(false)
  const [lastOutputCode,setLastOutputCode]=useState("")
  const [seeOutputCode,setSeeOutputCode]=useState(false)
  const [users,setUsers]=useState([])
  const [dark,setDark]=useState(false)
  const [running,setRunning]=useState(false)
  const [reset,setReset]=useState(false)
  const [noCode,setNoCode]=useState(true)

  const navigate=useNavigate();

  useEffect(()=>{
    socket.on("users-update",(userlist)=>{
      setUsers(userlist)
    })

    return ()=>socket.off("users-update");
  },[])

  useEffect(()=>{
    socket.on("user-connected",(userConn)=>{
      if(userConn!==username)
        toast.info(`${userConn} joined the room`)
    })

    return ()=>socket.off("user-connected");
  },[])

  useEffect(()=>{
    socket.on("user-disconnected",(userDis)=>{
      if(userDis!==username)
        toast.info(`${userDis} left the room`)
    })

    return ()=>socket.off("user-disconnected");
  },[])

  useEffect(() => {
    socket.on("duplicate-username", () => {
        toast.error("Username already exists in this room");
        navigate("/");
    });

    return () => {
        socket.off("duplicate-username");
    };
  }, []);

useEffect(() => {
  if (!room) return;

  const joinRoom=()=>{
    toast.success(`Joined Room: ${room}`);
    socket.emit("join-room", {room,username});
  };

  if (socket.connected){
    joinRoom();
  }else{
    socket.on("connect", joinRoom);
  }

  return ()=>{
    socket.off("connect", joinRoom);
  };
},[room]);

  useEffect(()=>{
    const syncHandler=({language,code})=>{
      isRemote.current=true;
      setLanguage(language);
      setCode(code);
    }

    const codeHandler=(value)=>{
      isRemote.current=true;
      setCode(value)
    }

    socket.on("sync-state",syncHandler)
    socket.on("receive-code",codeHandler)

    return ()=>{
      socket.off("sync-state", syncHandler);
      socket.off("receive-code", codeHandler);
    }
  },[]);

  const handleChange = (value) => {
    if(isRemote.current){
      isRemote.current=false;
      return;
    }

    setCode(value);
    socket.emit('send-code',{room,code:value,language});
  };
  
  const handleReset=(value)=>{
    if(!confirm(`Are you sure, you want to reset the code?`)) return;

    if(isRemote.current){
      isRemote.current=false;
      return;
    }
  
    setCode(value);
    socket.emit('send-code',{room,code:value,language});
    toast.success("Your code has been reset.");
  }

  const handleLanguage=(value)=>{
    if(isRemote.current){
      isRemote.current=false;
      return;
    }

    setLanguage(value)
    setCode(BOILERCODE[value])

    socket.emit('change-language',{room,language:value,code:BOILERCODE[value]});
  }

  const handleRun=async ()=>{
    try{
      setRunning(true);
      setLastOutputCode(code);
      const res= await fetch(`${import.meta.env.VITE_SERVER_URL}/run`,{
        method:"POST",
        headers:{
          "Content-type":"application/json"
        },
        body:JSON.stringify({code,language,input})
      })

      const result=await res.json();

      if(result.status==="Accepted"){
        setOutput(result.output)
        setError(false)
      } 
      else{
        setError(true)
        setOutput(result.compile_error)
      }
      setNoCode(false);
    }catch(err){

    }finally{
      setRunning(false);
    }
  }

  const theme={
    background: dark ? "bg-slate-900" : "bg-slate-50",
    background2: dark ? "bg-slate-800" : "bg-white",
    text: dark ? "text-slate-100" : "text-slate-900",
    border: dark ? "border-slate-600" : "border-slate-200",
    icon_text: dark ? "text-slate-300" : "text-slate-500",
    icon_hover: dark? "hover:bg-slate-700" : "hover:bg-slate-100",
    shadow: dark? "shadow-lg shadow-black/20" : "shadow-md",
    accent: dark? "text-blue-400" : "text-blue-600",
    current_user_highlight: dark?"text-amber-300":"text-amber-600"
  };

  return (
    <div className={`${theme.background} min-h-screen w-full flex flex-col gap-4 px-4 py-3`}>

      <header className={`${theme.background2} ${theme.shadow} border ${theme.border} rounded-xl h-14 px-5 flex justify-between items-center`}>
        <div className="flex gap-10 items-center" >  
          <p className={` ${theme.text} font-medium `}>
            Username: <b>{username}</b>
          </p>

          <div className="flex items-center gap-2">
            <p className={`${theme.text} font-medium`}>
              Room Id: <b>{room}</b>
            </p>

            <button
              className={`
                ${theme.icon_hover}
                ${theme.icon_text}
                p-1.5
                rounded-md
              `}
              onClick={async()=>{
                try{
                  await navigator.clipboard.writeText(room)
                  toast.success("Room ID Copied")
                }catch{
                  toast.error("Copy Failed")
                }
              }}
            >
              <IoCopy size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3" >
          <button type="button" 
            onClick={()=>setDark(!dark)} 
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${theme.icon_hover} ${theme.text}`} >
            <>
              {dark ? <MdDarkMode size={20} /> : <MdLightMode size={20} />}
              <span>{dark ? "Dark" : "Light"}</span>
            </>
          </button>
        </div>
      </header>


      <section className="w-full flex-1 flex gap-4 min-h-0">
        
        <div className={`${theme.text} ${theme.background2} ${theme.shadow} rounded-xl p-3 flex flex-col w-[15%] overflow-auto `}>
          <h5 className="font-bold text-lg mb-3"> Online Users ({users.length}) </h5>
          <ul className="">
            {users.map((user)=>{
              return (
                <li className={`my-[5%] ${user.username===username?`${theme.current_user_highlight}`:``} `} key={user.socketId} >{user.username}</li>
              );
            })}
          </ul>
        </div>


        <main className="flex-1 flex flex-col min-h-0">

            <div className={`${theme.background2} ${theme.shadow} ${theme.text} rounded-t-xl px-4 h-14 flex items-center justify-between ` } >
                <select className={`cursor-pointer px-3 py-2 rounded-lg border ${theme.background} ${theme.border} ${theme.text} bg-transparent`} value={language} onChange={(e)=>{
                  const newLang=e.target.value;
                  handleLanguage(newLang)
                }}>
                    {LANGUAGE.map((lang)=>(
                      <option key={lang.name} value={lang.value} className={`${theme.text} ${theme.background}`} >{lang.name}</option>
                    ))}
                </select>

                <div className="flex items-center gap-2" >
                  <button className={`${theme.icon_text} ${theme.icon_hover} p-2 rounded-lg transition`} onClick={async()=>{
                    try{
                      await navigator.clipboard.writeText(code)
                      toast.success("Code Copied To clipboard")
                    }catch{
                      toast.error("Copy Failed")
                    }
                  }} >
                    <IoCopy size={18} />
                  </button>
                  {!running && 
                    <button className={`bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 transition`} onClick={()=>handleRun()} >
                      <FaPlay size={18} />
                    </button>
                  }
                  {running &&
                   <Loader size="h-6 w-6" color={!dark?`border-t-gray-400`:`border-t-white`} backgroundColor={!dark?`border-gray-300`:`border-gray-500`} />
                  }
                  <button className={`bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3 py-2 transition`} onClick={()=>handleReset(BOILERCODE[language])} ><FaArrowRotateRight size={18} /></button>
                </div>
            </div>

          {seeOutputCode && 
            <div className={`${theme.background} ${theme.text} border ${theme.border} h-[70%] w-[100%] relative overflow-auto `} >
              <button type="button" onClick={()=>setSeeOutputCode(false)} className={`${theme.icon_text} ${theme.icon_hover} absolute right-[0.5%] top-[2%]`} ><GiCancel size={18} /></button>
              <pre className="p-[1%]" >{lastOutputCode}</pre>
            </div>
          }

          {!seeOutputCode &&     
            <Editor
              height={"70%"}
              width={"100%"}
              theme={dark ? "vs-dark" : "light"}
              value={code}
              onChange={handleChange}
              language={language}
              options={{
                  fontSize:18,
                  minimap:{enabled:false},
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true
              }}  
            />
          }

            <div className="h-[220px] w-full flex" >
              <div className={`${theme.background2} ${theme.text} border ${theme.border} rounded-bl-xl p-3 h-full w-1/2`} >
                <h5 className="text-center font-bold" >INPUT</h5>
                <textarea 
                value={input}
                onChange={(e)=>{setInput(e.target.value)}}
                placeholder="Please give input here."
                className={`h-[90%] w-[100%] bg-transparent ${theme.text} placeholder-gray-400 border ${theme.border} rounded-lg p-2 outline-none resize-none `} 
                >

                </textarea>
              </div>

              <div className={` ${theme.background2} ${theme.text} border ${theme.border} rounded-br-xl p-3 h-full w-1/2 relative flex flex-col min-h-0`} >
                <div className="flex justify-between items-center mb-2">
                <h5 className="font-bold">OUTPUT</h5>

                {!noCode && <button type="button" onClick={()=>setSeeOutputCode(true)} className=" text-blue-500 hover:text-blue-600 text-sm font-medium">
                  See Code
                </button>}
              </div>
                {!error && !noCode && (<p className="text-green-500 font-semibold mb-2">✓ Accepted</p>)}
                {error && !noCode && (<p className="text-red-500 font-semibold mb-2">✗ Compilation Error</p>)}
                {<pre className={` overflow-y-auto overflow-x-hidden flex-1 min-h-0 whitespace-pre-wrap break-words` }>{output}</pre>} 
              </div>
            </div>

        </main>
      </section>
    </div>
  );
};

export default CodingInterface;
