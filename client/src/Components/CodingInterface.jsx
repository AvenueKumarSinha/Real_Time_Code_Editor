import React, { useState } from "react";
import { FaPlay } from "react-icons/fa";
import { IoCopy } from "react-icons/io5";
import Editor from "@monaco-editor/react";
import { RiResetRightLine } from "react-icons/ri";
import { GiCancel } from "react-icons/gi";

import { LANGUAGE,BOILERCODE } from "../../../constants";
import { useSearchParams } from "react-router-dom";
import { socket } from "../socket";
import { useRef } from "react";
import { useEffect } from "react";

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

useEffect(() => {
  if (!room) return;

  const joinRoom=()=>{
    console.log("Joining room:", room);
    socket.emit("join-room", room);
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
      setLastOutputCode(code);
      const res= await fetch(`${import.meta.env.VITE_SERVER_URL}/run`,{
        method:"POST",
        headers:{
          "Content-type":"application/json"
        },
        body:JSON.stringify({code,language,input})
      })

      const result=await res.json();

      console.log(result)
      if(result.status==="Accepted"){
        setOutput(result.output)
        setError(false)
      } 
      else{
        setError(true)
        setOutput(result.compile_error)
      }
    }catch(err){

    }
  }


  return (
    <div className="bg-red-500 h-screen w-screen flex flex-col gap-[2vh] justify-center">

      <header className="bg-blue-200 w-[95vw] h-[5vh] m-auto flex justify-around">
        <p className="bg-red-100 py-[1.25vh]">
          Username: <b>{username}</b>
        </p>
        <p className="bg-red-100 py-[1.25vh]">
          Room Id: <b>{room}</b>
        </p>
        <button className="bg-pink-100 text-cyan-700" onClick={async()=>{
          try{
            await navigator.clipboard.writeText(room)
            console.log("Code Copied To clipboard")
          }catch{
            console.log("Copy Failed")
          }
        }} >
          <IoCopy size={"4vh"} />
        </button>
        <button className="bg-blue-100 text-lime-700" onClick={()=>handleRun()} >
          <FaPlay size={"4vh"}/>
        </button>
        
      </header>


      <section className="bg-green-200 w-[95vw] h-[85vh] m-auto flex gap-[5%]">
        
        <div className="bg-pink-200 h-[100%] w-[10%] text-center">
          <h5 className="font-bold">Current Users</h5>
          <ul className="">
            <li className="my-[5%]">User1</li>
            <li className="my-[5%]">User1</li>
            <li className="my-[5%]">User1</li>
            <li className="my-[5%]">User1</li>
            <li className="my-[5%]">User1</li>
          </ul>
        </div>


        <main className="bg-yellow-500 h-[100%] w-[85%]">

            <div className="bg-blue-800 h-[5%] w-[100%] flex justify-between" >
                <select className="" value={language} onChange={(e)=>{
                  const newLang=e.target.value;
                  handleLanguage(newLang)
                }}>
                    {LANGUAGE.map((lang)=>(
                      <option key={lang.name} value={lang.value} >{lang.name}</option>
                    ))}
                </select>

                <button className="bg-pink-100 text-cyan-700" onClick={async()=>{
                  try{
                    await navigator.clipboard.writeText(code)
                    console.log("Code Copied To clipboard")
                  }catch{
                    console.log("Copy Failed")
                  }
                }} >
                  <IoCopy size={"4vh"} />
                </button>
                <button className="bg-green-800" onClick={()=>handleChange(BOILERCODE[language])} ><RiResetRightLine size={'90%'} /></button>
            </div>

          {seeOutputCode && 
            <div className="bg-cyan-800 h-[55%] w-[100%] relative" >
              <button type="button" onClick={()=>setSeeOutputCode(false)} className="text-red-600 absolute right-[0.5%] top-[2%]" ><GiCancel size={30} /></button>
              <pre>{lastOutputCode}</pre>
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

            <div className="bg-blue-500 h-[40%] w-[100%] flex" >
              <div className="bg-red-700 h-[100%] w-[50%] p-2" >
                <h5 className="text-center font-bold" >INPUT</h5>
                <textarea 
                value={input}
                onChange={(e)=>{setInput(e.target.value)}}
                placeholder="Please give input here."
                className="h-[90%] w-[100%] bg-transparent text-black placeholder-gray-400 border border-gray-600 rounded-lg p-2 outline-none resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-sm" 
                >

                </textarea>
              </div>

              <div className="bg-green-700 h-[100%] w-[50%] p-2 relative" >
                <h5 className="text-center font-bold" >OUTPUT</h5>
                {!error && <pre>{output}</pre>} 
                {error && <pre className="text-red-500" >{output}</pre>}
                <button type="button" onClick={()=>setSeeOutputCode(true)} className="bg-cyan-500 absolute right-[2%] bottom-[5%]" >See Code</button>
              </div>
            </div>

        </main>
      </section>
    </div>
  );
};

export default CodingInterface;
