import React, { useState } from "react";

import Editor from "@monaco-editor/react";

import { FaPlay } from "react-icons/fa";
import { IoCopy } from "react-icons/io5";
import { FaArrowRotateRight } from "react-icons/fa6";
import { GiCancel } from "react-icons/gi";
import { MdLightMode } from "react-icons/md";
import { MdDarkMode } from "react-icons/md";
import { ImExit } from "react-icons/im";
import { IoMdNotificationsOff } from "react-icons/io";
import { IoMdNotifications } from "react-icons/io";
import { FaCrown } from "react-icons/fa";
import { MdPersonRemove } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { IoChatboxEllipses } from "react-icons/io5";

import { LANGUAGE,BOILERCODE } from "../../../constants";
import { LANGUAGE_VALUE_TO_NAME } from "../../../constants";

import { useSearchParams } from "react-router-dom";
import { socket } from "../socket";
import { useRef } from "react";
import { useEffect } from "react";

import Loader from "./Loader";

import { toast } from "react-toastify";
import { NavLink,useNavigate, useLocation } from "react-router-dom";

import Swal from 'sweetalert2'
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import Settings from "./Settings";
import Chat from "./Chat";

const CodingInterface = () => {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(BOILERCODE[language]);

  const [params]=useSearchParams()
  const username=params.get("username");
  const room=Number(params.get("room"))
  const location=useLocation();
  const roomMode=location.state?.roomMode??null;

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
  const[notifications,setNotifications]=useState(true)

  const [admin,setAdmin]=useState(false)
  const [currentRoomMode,setCurrentRoomMode]=useState("admin")

  const [settings,setSettings]=useState(false)
  const [settingsLanguage,setSettingsLanguage]=useState(false)
  const [settingsReset,setSettingsReset]=useState(false)
  const [settingsRoomLock,setSettingsRoomLock]=useState(false)
  const [settingsChatEnable,setSettingsChatEnable]=useState(true)
  const [settingsChatHistory,setSettingsChatHistory]=useState(true)

  const [chatOpen,setChatOpen]=useState(false)
  const [unreadChats, setUnreadChats]=useState(0)
  const [messages, setMessages]=useState([]);
  
  const navigate=useNavigate();
  
  useEffect(()=>{
    if(!username){
      toast.error("No username is given")
      navigate("/")
    }
  },[])

  useEffect(()=>{
    if(!room){
      toast.error("No room id is given")
      navigate("/")
    }
  },[])

  useEffect(()=>{
    socket.on("users-update",(userlist)=>{
      setUsers(userlist)
    })

    return ()=>socket.off("users-update");
  },[])

  useEffect(()=>{
    socket.on("user-connected",(userConn)=>{
      if(userConn!==username){
        if(notifications) toast.info(`${userConn} joined the room`,{autoClose:3000})
      }
    })

    return ()=>socket.off("user-connected");
  },[notifications])

  useEffect(()=>{
    socket.on("user-disconnected",(userDis)=>{
      if(userDis!==username){
        if(notifications) toast.info(`${userDis} left the room`,{autoClose:3000})
      }
    })

    return ()=>socket.off("user-disconnected");
  },[notifications])

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
    socket.emit("join-room", {room,username,roomMode},(response)=>{
      if(!response.success){
        if(response.roomLock) toast.warn("This room is currently locked by the admin. Ask the admin to unlock the room in order to join.");
        else toast.error("Unable to join the room.");

        navigate("/");
        return;
      }

      toast.success(`Joined Room: ${room}`);
    });
  };

  if (socket.connected){
    joinRoom();
  }else{
    socket.on("connect", joinRoom);
  }

  return ()=>{
    socket.off("connect", joinRoom);
  };
},[room,username,roomMode]);

useEffect(() => {
  socket.on("joined-room",({admin,roomMode,settings})=>{
      setAdmin(admin);
      setCurrentRoomMode(roomMode);
      setSettingsLanguage(settings.language);
      setSettingsReset(settings.reset);
      setSettingsRoomLock(settings.roomLock);
      setSettingsChatEnable(settings.chatEnable);
      setSettingsChatHistory(settings.chatHistory);
    });

  return () => {
    socket.off("joined-room");
  };
}, []);

useEffect(() => {
  socket.on("toast-change-language", ({language,usernameThatChangedTheLanguage}) => {
    if(usernameThatChangedTheLanguage!=username){
     toast.info(`The language has been changed to ${LANGUAGE_VALUE_TO_NAME[language]} by ${usernameThatChangedTheLanguage}`,{autoClose:3000});
    }
  });

  return () => {
      socket.off("toast-change-language");
  };
}, []);

useEffect(() => {
  socket.on("toast-reset-code", ({usernameThatChangedTheLanguage}) => {
    if(usernameThatChangedTheLanguage!=username){
     toast.info(`The code has been reset by ${usernameThatChangedTheLanguage}`,{autoClose:3000});
    }
  });

  return () => {
      socket.off("toast-reset-code");
  };
}, []);

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

  useEffect(()=>{
    socket.on("not-admin",()=>{
      toast.warn("Only the room admin can perform this action.");
    });

    return ()=>{
      socket.off("not-admin");
    };
}, []);

useEffect(()=>{
  socket.on("kicked",({kickedBy})=>{
      toast.error(`You were kicked by ${kickedBy}`);
      navigate("/");
    });

  return ()=>{
    socket.off("kicked");
  };
}, []);

useEffect(()=>{
  socket.on("kick-update",({kickedBy,kicked})=>{
    if(kickedBy!==username){
      if(notifications) toast.info(`${kicked} has been kicked by ${kickedBy}`,{autoClose:2000})
    }
  });

  return ()=>{
    socket.off("kick-update");
  };
},[notifications]);

useEffect(()=>{
  socket.on("room-closed",()=>{
    toast.info("Admin has left, therefore the room is now closed!",{autoClose:3000})
    navigate("/");
  })

  return ()=>{
    socket.off("room-closed");
  }
},[])

useEffect(()=>{
  socket.on("update-settings",(settings)=>{
    setSettingsLanguage(settings.language);
    setSettingsReset(settings.reset);
    setSettingsRoomLock(settings.roomLock);
    setSettingsChatEnable(settings.chatEnable);
    setSettingsChatHistory(settings.chatHistory);
  })

  return ()=>{
    socket.off("update-settings");
  }
},[])

useEffect(()=>{
  socket.on("receive-chat",(chat)=>{
    if(currentRoomMode==="admin" && !settingsChatEnable) return;

    setMessages(prev=>[...prev,chat]);

    if(!chatOpen) setUnreadChats(prev=>prev+1);
  })

  return ()=>{
    socket.off("receive-chat");
  }
},[chatOpen,settingsChatEnable])

useEffect(()=>{
  socket.on("chat-history",(chats)=>{
    if(currentRoomMode==="admin" && !settingsChatHistory) return;
    setMessages(chats);
  })

  return ()=>{
    socket.off("chat-history");
  }
},[settingsChatHistory])

  const handleChange = (value) => {
    try{
      if(isRemote.current){
        isRemote.current=false;
        return;
      }

      setCode(value);
      socket.emit('send-code',{room,code:value,language});
    }catch(err){
      toast.error(`Code syncing has failed unexpectedly! Leaving the room, sorry for the inconvenience.`,{autoClose:4000});
      console.log(`Code syncing failed due to: ${err}`);

      handleLeaveRoom();
    }
  };
  
  const handleReset=async (value)=>{
    try{
      if(currentRoomMode==="admin" && !admin && !settingsReset){
        toast.warn("Only admin can reset the code as per settings.");
        return;
      }

      const result= await Swal.fire({
        title: "Reset Code?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: `Yes, reset the code`
      });

      if(!result.isConfirmed) return;

      if(isRemote.current){
        isRemote.current=false;
        return;
      }
    
      setCode(value);
      socket.emit('send-code',{room,code:value,language});
      socket.emit('reset-code',{room});
      if(notifications) toast.success("Your code has been reset.");
    }catch(err){
      toast.error("Unable to reset the code.")
    }
  }

  const handleLanguage=async (value)=>{
    try{
      if(currentRoomMode==="admin" && !admin && !settingsLanguage){
        toast.warn("Only admin can change the language as per settings.")
        return;
      }

      const result = await Swal.fire({
        title: "Change Language?",
        // text: "This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: `Yes, change the language to ${LANGUAGE_VALUE_TO_NAME[value]}`,
      });

      if(!result.isConfirmed) return;

      if(isRemote.current){
        isRemote.current=false;
        return;
      }

      setLanguage(value)
      setCode(BOILERCODE[value])

      socket.emit('change-language',{room,language:value,code:BOILERCODE[value]});

      if(notifications) toast.success(`The language has been changed to ${LANGUAGE_VALUE_TO_NAME[value]} successfully`)
    }catch(err){
      toast.error("Unable to change the language.")
    }
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

  const handleLeaveRoom=async()=>{
    try{
      if(currentRoomMode==="admin" && admin && users.length!==1){
        const response=await Swal.fire({
          title:"You are the admin, if you leave then everybody is forced out of the room",
          icon:"warning",
          showCancelButton:true,
          confirmButtonText:"Yes, I want to leave the room."
        })

        if(!response.isConfirmed) return;

        socket.emit("admin-left");
        return;
      }

      socket.emit("leave-room");
      toast.success(`Left Room: ${room}`);
      navigate("/");
    }catch(err){
      toast.error(`Unable to leave the room!`);
    }
  }

  const handleKickUser=async(socketId,targetUserName)=>{
    try{
      const result=await Swal.fire({
        title:`Kick ${targetUserName}?`,
        icon:"warning",
        showCancelButton:true,
        confirmButtonText:`Yes, kick ${targetUserName}`
      })

      if(!result.isConfirmed) return;

      socket.emit("kick-user",{room,targetSocketId:socketId},(response)=>{
        if(!response.success) toast.error(`Unable to kick ${targetUserName}`)
        if(response.success) toast.success(`${targetUserName} has been kicked.`)
      });
    }catch(err){
      toast.error(`Unable to kick ${targetUserName}`);
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
    current_user_highlight: dark?"text-amber-300":"text-amber-600",
    tooltip_background: dark?"#000000":"#f5f4f4",
    tooltip_color: dark?"#f8fafc":"#0f172a",
    tooltip_border: dark ? "1px solid #475569" : "1px solid #e2e8f0",
  };

  return (
    
    <div className={`${theme.background} min-h-screen w-full flex flex-col gap-4 px-4 py-3`}>

      {currentRoomMode==="admin" && <Settings open={settings} onClose={()=>setSettings(false)} dark={dark} roomMode={currentRoomMode} admin={admin} settingsLanguage={settingsLanguage} settingsReset={settingsReset} settingsRoomLock={settingsRoomLock} settingsChatEnable={settingsChatEnable} settingsChatHistory={settingsChatHistory} />}
      <Chat open={chatOpen} onClose={()=>setChatOpen(false)} dark={dark} messages={messages} username={username} />

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
                  if(notifications) toast.success("Room ID Copied")
                }catch{
                  toast.error("Copy Failed")
                }
              }}
              data-tooltip-id="icon-tooltip"
              data-tooltip-content={"Copy room ID"}
            >
              <IoCopy size={18} />
            </button>
          </div>

          {currentRoomMode === "admin" && admin && (
            <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg">
              ⚠️ You are the room admin. Refreshing, closing the tab, or leaving the page may close the room for everyone.
            </div>
          )}
          
        </div>

        <div className="flex items-center gap-3" >
          <button type="button"
            onClick={()=>setNotifications(!notifications)}
            data-tooltip-id="icon-tooltip"
            data-tooltip-content={`${notifications?"Turn OFF Notifications":"Turn ON Notification"}`}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${theme.icon_hover} ${theme.text}`} >
            <>
              {notifications ? <IoMdNotifications size={20} /> : <IoMdNotificationsOff size={20} />}
            </>
          </button>

          <button type="button" 
            onClick={()=>setDark(!dark)} 
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${theme.icon_hover} ${theme.text}`} >
            <>
              {dark ? <MdDarkMode size={20} /> : <MdLightMode size={20} />}
              <span>{dark ? "Dark" : "Light"}</span>
            </>
          </button>

          {currentRoomMode==="admin" && <button type="button"
            data-tooltip-id="icon-tooltip"
            data-tooltip-content={"Settings"}
            onClick={()=>setSettings(true)}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${theme.icon_hover} ${theme.text}`}
          >
            <IoMdSettings size={20} />
          </button>}

          <button type="button"
           data-tooltip-id="icon-tooltip"
           data-tooltip-content={"Leave Room"}
           onClick={()=>handleLeaveRoom()} 
           className={`px-3 py-2 rounded-lg flex items-center gap-2 ${theme.icon_hover} ${theme.text}`} >
              <ImExit size={18} />
           </button>
        </div>
      </header>


      <section className="w-full flex-1 flex gap-4 min-h-0">
        
        <div className={`${theme.text} ${theme.background2} ${theme.shadow} rounded-xl p-3 flex flex-col w-[15%] overflow-auto `}>
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-bold text-lg">
              Online Users ({users.length})
            </h5>

            <button
              type="button"
              className={`relative p-2 rounded-lg transition ${theme.icon_hover} ${theme.text} cursor-pointer ${(currentRoomMode==="admin" && !settingsChatEnable) && "cursor-not-allowed"}`}
              onClick={()=>{
                setChatOpen(true);
                setUnreadChats(0);
              }}
              data-tooltip-id="icon-tooltip"
              data-tooltip-content={`Open Chats ${(currentRoomMode==="admin" && !settingsChatEnable)?"(Disabled by Admin)":""}`}
              disabled={currentRoomMode==="admin" && !settingsChatEnable}
            >
              <IoChatboxEllipses size={20} />

              {unreadChats > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadChats > 99 ? "99+" : unreadChats}
                </span>
              )}
            </button>
          </div>

          <ul className="">
            {users.map((user)=>{
              return(
                <li key={user.socketId} className={`flex items-center justify-between rounded-lg px-2 py-2 ${user.username === username ? theme.current_user_highlight : ""}`}>
                  <div className="flex items-center gap-2">
                    <span>
                      {user.username}
                      {user.username === username && " (You)"}
                    </span>
                    {user.admin && (<FaCrown className="text-yellow-500" size={20} />)}
                  </div>

                  {currentRoomMode==="admin" && admin && !user.admin &&
                    user.username !== username && (
                      <button className="text-red-500 hover:text-red-600 transition"
                        onClick={() =>handleKickUser(user.socketId,user.username)}
                        title="Kick User"
                      >
                        <MdPersonRemove size={20} />
                      </button>
                  )}
                </li>
              )})}
          </ul>
        </div>


        <main className="flex-1 flex flex-col min-h-0">

            <div className={`${theme.background2} ${theme.shadow} ${theme.text} rounded-t-xl px-4 h-14 flex items-center justify-between ` } >
                <select className={`cursor-pointer px-3 py-2 rounded-lg border ${theme.background} ${theme.border} ${theme.text} bg-transparent`} value={language} onChange={(e)=>{
                  const newLang=e.target.value;
                  handleLanguage(newLang)
                }}>
                    {LANGUAGE.map((lang)=>(
                      <option key={lang.name} value={lang.value} className={`${theme.text} ${theme.background}`} disabled={currentRoomMode==="admin" && !admin && !settingsLanguage} >{lang.name}</option>
                    ))}
                </select>

                <div className="flex items-center gap-2" >
                  <button className={`${theme.icon_text} ${theme.icon_hover} p-2 rounded-lg transition`} onClick={async()=>{
                    try{
                      await navigator.clipboard.writeText(code)
                      if(notifications) toast.success("Code Copied To clipboard")
                    }catch{
                      toast.error("Copy Failed")
                    }
                  }} 
                  data-tooltip-id="icon-tooltip"
                  data-tooltip-content={"Copy Code"}
                  >
                    <IoCopy size={18} />
                  </button>
                  {!running && 
                    <button
                     data-tooltip-id="icon-tooltip"
                     data-tooltip-content={"Run Code"}
                     className={`bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 transition`} onClick={()=>handleRun()} >
                      <FaPlay size={18} />
                    </button>
                  }
                  {running &&
                   <Loader size="h-6 w-6" color={!dark?`border-t-gray-400`:`border-t-white`} backgroundColor={!dark?`border-gray-300`:`border-gray-500`} />
                  }
                  <button
                   data-tooltip-id="icon-tooltip"
                   data-tooltip-content={`Reset Code ${(currentRoomMode==="admin" && !admin && !settingsReset)?"(Disabled by Admin)":""}`}
                   className={`bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-3 py-2 transition cursor-pointer ${(currentRoomMode==="admin" && !admin && !settingsReset) && "cursor-not-allowed"} `} onClick={()=>handleReset(BOILERCODE[language])} disabled={currentRoomMode==="admin" && !admin && !settingsReset} ><FaArrowRotateRight size={18} /></button>
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
                {!error && !noCode && (<p className="text-green-500 font-semibold mb-2">✓ Successful</p>)}
                {error && !noCode && (<p className="text-red-500 font-semibold mb-2">✗ Error</p>)}
                {<pre className={` overflow-y-auto overflow-x-hidden flex-1 min-h-0 whitespace-pre-wrap break-words` }>{output}</pre>} 
              </div>
            </div>

        </main>
      </section>

      <Tooltip 
        id="icon-tooltip"
        place="bottom"
        opacity={1}
        delayShow={500}
        style={{
          backgroundColor: theme.tooltip_background,
          color: theme.tooltip_color,
          border: theme.tooltip_border,
          fontSize: "14px",
          padding: "4px 8px",
          borderRadius: "6px",
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}
      />
    </div>
  );
};

export default CodingInterface;
