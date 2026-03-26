import React, { useState } from "react";
import { FaPlay } from "react-icons/fa";
import { IoCopy } from "react-icons/io5";
import Editor from "@monaco-editor/react";
import { RiResetRightLine } from "react-icons/ri";

import { LANGUAGE, BOILERCODE } from "../constants";

const CodingInterface = () => {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(BOILERCODE[language]);

  const handleChange = (value) => {
    setCode(value);
  };


  return (
    <div className="bg-red-500 h-screen w-screen flex flex-col gap-[2vh] justify-center">

      <header className="bg-blue-200 w-[95vw] h-[5vh] m-auto flex justify-around">
        <p className="bg-red-100 py-[1.25vh]">
          Room Id: <b>23221</b>
        </p>
        <button className="bg-blue-100 text-lime-700">
          <FaPlay size={"4vh"}/>
        </button>
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
                <select className="" onClick={(e)=>{
                  const newLang=e.target.value;
                  setLanguage(newLang)
                  setCode(BOILERCODE[newLang])
                }}>
                    {LANGUAGE.map((lang)=>(
                      <option key={lang.name} value={lang.name} >{lang.name} {lang.version}</option>
                    ))}
                </select>

                <button className="bg-green-800" onClick={()=>setCode(BOILERCODE[language])} ><RiResetRightLine size={'90%'} /></button>
            </div>

          <Editor
            height={"95%"}
            width={"100%"}
            theme="vs-dark"
            value={code}
            onChange={handleChange}
            defaultLanguage={language}
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
