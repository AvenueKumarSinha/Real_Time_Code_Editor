import React, { useState } from "react";
import { FaPlay } from "react-icons/fa";
import { IoCopy } from "react-icons/io5";
import Editor from "@monaco-editor/react";
import { RiResetRightLine } from "react-icons/ri";

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
    socket.emit('send-code',{room,code:value});
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

  console.log("LANG:", language);


  return (
    <div className="bg-red-500 h-screen w-screen flex flex-col gap-[2vh] justify-center">

      <header className="bg-blue-200 w-[95vw] h-[5vh] m-auto flex justify-around">
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
        <button className="bg-blue-100 text-lime-700">
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

          <Editor
            height={"95%"}
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
        </main>
      </section>
    </div>
  );
};

export default CodingInterface;
