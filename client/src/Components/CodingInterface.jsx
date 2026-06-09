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
    }catch(err){

    }finally{
      setRunning(false);
    }
  }

  const theme={
    background: dark?"bg-[#000000]" : "bg-gray-100",
    background2:dark?"bg-[#373740]" : "bg-gray-200",
    text: dark?"text-white" : "text-black",
    border: dark?"border-gray-300" : "border-gray-400",
    icon_text:dark?"text-gray-200" : "text-gray-500",
    icon_hover:dark?"hover:bg-[#2d2d35]" : "hover:bg-gray-300",
    // io: dark?"bg-gray-800 text-white border-gray-600" : "bg-gray-200 text-black border-gray-300",
  };

  return (
    <div className={`${theme.background} h-screen w-screen flex flex-col gap-[2vh] justify-center`}>

      <header className={`${theme.background2} border-b ${theme.border} w-[95vw] h-[5vh] m-auto flex justify-around relative`}>
        <div className="flex gap-[25%] h-[100%] w-[50%] absolute left-[0.2%]" >  
          <p className={` ${theme.text} py-[1.25vh] w-[50%] `}>
            Username: <b>{username}</b>
          </p>
          <p className={`${theme.text} py-[1.25vh]`}>
            Room Id: <b>{room}</b>
          </p>
        </div>

        <div className="flex h-[100%] w-fit gap-[5%] absolute right-[0%]" >
          <button className={`${theme.icon_hover} ${theme.icon_text} ${theme.icon_hover}`} onClick={async()=>{
            try{
              await navigator.clipboard.writeText(room)
              toast.success("Room Id Copied To clipboard")
            }catch{
              toast.error("Copy Failed")
            }
          }} >
            <IoCopy size={"90%"} />
          </button>
          
          <button type="button" 
            onClick={()=>setDark(!dark)} 
            className={`${theme.icon_hover} ${dark?"text-white":"text-yellow-500"}`} >
            {dark?<MdDarkMode size={"90%"} color="" />:<MdLightMode size={"90%"} color="" />}
          </button>
        </div>
      </header>


      <section className="w-[95vw] h-[85vh] m-auto flex gap-[5%]">
        
        <div className={`${theme.text} ${theme.background2} h-[100%] w-[10%] text-center overflow-auto `}>
          <h5 className="font-bold">Current Users</h5>
          <ul className="">
            {users.map((user)=>{
              return (
                <li className="my-[5%]" key={user.socketId} >{user.username}</li>
              );
            })}
          </ul>
        </div>


        <main className="h-[100%] w-[85%]">

            <div className={`${theme.background2} h-[5%] w-[100%] flex justify-between relative ` } >
                <select className="cursor-pointer" value={language} onChange={(e)=>{
                  const newLang=e.target.value;
                  handleLanguage(newLang)
                }}>
                    {LANGUAGE.map((lang)=>(
                      <option key={lang.name} value={lang.value} >{lang.name}</option>
                    ))}
                </select>

                <div className="flex gap-[5%] h-[100%] w-fit absolute right-[0%]" >
                  <button className={`${theme.icon_hover} ${theme.icon_text}`} onClick={async()=>{
                    try{
                      await navigator.clipboard.writeText(code)
                      toast.success("Code Copied To clipboard")
                    }catch{
                      toast.error("Copy Failed")
                    }
                  }} >
                    <IoCopy size={"90%"} />
                  </button>
                  {!running && 
                    <button className={`${theme.icon_hover} ${theme.icon_text}`} onClick={()=>handleRun()} >
                      <FaPlay size={"90%"}/>
                    </button>
                  }
                  {running &&
                   <Loader size="h-[80%]" color={!dark?`border-t-gray-400`:`border-t-white`} backgroundColor={!dark?`border-gray-300`:`border-gray-500`} />
                  }
                  <button className={`${theme.icon_hover} ${theme.icon_text}`} onClick={()=>handleReset(BOILERCODE[language])} ><FaArrowRotateRight size={'90%'} /></button>
                </div>
            </div>

          {seeOutputCode && 
            <div className={`${theme.background} ${theme.text} border ${theme.border} h-[55%] w-[100%] relative overflow-auto `} >
              <button type="button" onClick={()=>setSeeOutputCode(false)} className={`${theme.icon_text} ${theme.icon_hover} absolute right-[0.5%] top-[2%]`} ><GiCancel size={30} /></button>
              <pre className="p-[1%]" >{lastOutputCode}</pre>
            </div>
          }

          {!seeOutputCode &&     
            <Editor
              height={"55%"}
              width={"100%"}
              theme="vs-dark"
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

            <div className="h-[40%] w-[100%] flex" >
              <div className={`${theme.background2} ${theme.text} border-r border-t ${theme.border} h-[100%] w-[50%] p-2`} >
                <h5 className="text-center font-bold" >INPUT</h5>
                <textarea 
                value={input}
                onChange={(e)=>{setInput(e.target.value)}}
                placeholder="Please give input here."
                className={`h-[90%] w-[100%] bg-transparent ${theme.text} placeholder-gray-400 border ${theme.border} rounded-lg p-2 outline-none resize-none `} 
                >

                </textarea>
              </div>

              <div className={`${theme.background2} ${theme.text} border-t ${theme.border} h-[100%] w-[50%] p-2 relative`} >
                <h5 className="text-center font-bold" >OUTPUT</h5>
                {!error && <pre className={` overflow-auto h-[85%]` }>{output}</pre>} 
                {error && <pre className={`text-red-500 overflow-auto h-[85%]`} >{output}</pre>}
                <button type="button" onClick={()=>setSeeOutputCode(true)} className={`${theme.icon_text} ${!dark?theme.icon_hover:"hover:bg-gray-500"} absolute right-[2%] bottom-[2%]`} >See Code</button>
              </div>
            </div>

        </main>
      </section>
    </div>
  );
};

export default CodingInterface;
