import React from 'react'
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

import { toast } from 'react-toastify';
import { GiCancel } from "react-icons/gi";

import { Tooltip } from 'react-tooltip';
import { socket } from '../socket';

const Settings = ({open, onClose, dark, roomMode, admin, settingsLanguage, settingsReset, settingsRoomLock, settingsChatEnable, settingsChatHistory}) => {
    if(!open) return null;

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
      } = useForm();

    const theme={
        background: dark ? "bg-slate-900" : "bg-slate-50",
        background2: dark ? "bg-slate-800" : "bg-white",
        text: dark ? "text-slate-100" : "text-slate-900",
        border: dark ? "border-slate-600" : "border-slate-200",
        icon_text: dark ? "text-slate-300" : "text-slate-500",
        icon_hover: dark? "hover:bg-slate-700" : "hover:bg-slate-100",
        shadow: dark? "shadow-lg shadow-black/20" : "shadow-md",
        tooltip_background: dark?"#000000":"#f5f4f4",
        tooltip_color: dark?"#f8fafc":"#0f172a",
        tooltip_border: dark ? "1px solid #475569" : "1px solid #e2e8f0",
    };

    const [language,setLanguage]=useState(settingsLanguage)
    const [reset,setReset]=useState(settingsReset)
    const [roomLock,setRoomLock]=useState(settingsRoomLock)
    const [chatEnable, setChatEnable]=useState(settingsChatEnable)
    const [chatHistory, setChatHistory]=useState(settingsChatHistory)

    useEffect(()=>{
        setLanguage(settingsLanguage);
        setReset(settingsReset);
        setRoomLock(settingsRoomLock);
        setChatEnable(settingsChatEnable);
        setChatHistory(settingsChatHistory);
    }, [settingsLanguage, settingsReset, settingsRoomLock, settingsChatEnable, settingsChatHistory]);

    const onSubmit=async()=>{
        if(roomMode==="admin" && !admin){
            toast.warn("Only admin can change these settings!");
            return;
        }

        try{
            socket.emit("update-settings-server",{language:language,reset:reset,roomLock:roomLock,chatEnable:chatEnable,chatHistory:chatHistory},(response)=>{
                if(!response.success && !response.admin) toast.error("Unable to change the settings!");
                else if(response.success) toast.success("Settings changed successfully.");
            });
            
            onClose();
        }catch(err){
            toast.error("An error occurred!")
        }
    }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`} >
        <div className={`w-[500px] max-w-[90vw] rounded-2xl ${theme.background} shadow-2xl border ${theme.border} p-6 ${theme.text} `} >
            <div className={`flex items-center justify-between mb-6`} >
                <h2 className={`text-2xl font-bold ${theme.text} `}>
                    Room Settings
                </h2>
                
                <button
                    onClick={onClose}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 ${theme.icon_hover} ${theme.text}`}
                    data-tooltip-id="icon-tooltip"
                    data-tooltip-content={"Close Settings"}
                >
                    <GiCancel size={20} />
                </button>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
            >
                <label
                    htmlFor="language"
                    className={`w-full flex items-center justify-between rounded-xl border ${theme.border} ${theme.background2} p-4 transition hover:border-blue-400 ${(roomMode==="admin" && !admin)?"cursor-not-allowed":"cursor-pointer"}`}
                >
                    <div className="flex flex-col">
                        <p className={`font-semibold ${theme.text}`}>
                            Language
                        </p>

                        <p className={`text-sm ${theme.icon_text}`}>
                            Allow others to change the language of this room.
                        </p>
                    </div>

                    <input
                        type="checkbox"
                        id="language"
                        className={`h-5 w-5 accent-blue-600 ${(roomMode==="admin" && !admin)?"cursor-not-allowed":"cursor-pointer"}`}
                        checked={language}
                        onChange={(e) =>
                            setLanguage(e.target.checked ? true : false)
                        }
                        disabled={roomMode==="admin" && !admin}
                    />
                </label>

                <label
                    htmlFor="reset"
                    className={`w-full flex items-center justify-between rounded-xl border ${theme.border} ${theme.background2} p-4 transition hover:border-blue-400 ${(roomMode==="admin" && !admin)?"cursor-not-allowed":"cursor-pointer"}`}
                >
                    <div className="flex flex-col">
                        <p className={`font-semibold ${theme.text}`}>
                            Reset
                        </p>

                        <p className={`text-sm ${theme.icon_text}`}>
                            Allow others to reset the code of this room.
                        </p>
                    </div>

                    <input
                        type="checkbox"
                        id="reset"
                        className={`h-5 w-5 accent-blue-600 ${(roomMode==="admin" && !admin)?"cursor-not-allowed":"cursor-pointer"}`}
                        checked={reset}
                        onChange={(e) =>
                            setReset(e.target.checked ? true : false)
                        }
                        disabled={roomMode==="admin" && !admin}
                    />
                </label>

                <label
                    htmlFor="roomLock"
                    className={`w-full flex items-center justify-between rounded-xl border ${theme.border} ${theme.background2} p-4 transition hover:border-blue-400 ${(roomMode==="admin" && !admin)?"cursor-not-allowed":"cursor-pointer"}`}
                >
                    <div className="flex flex-col">
                        <p className={`font-semibold ${theme.text}`}>
                            Room Lock
                        </p>

                        <p className={`text-sm ${theme.icon_text}`}>
                            Lock the room so that others cannot join.
                        </p>
                    </div>

                    <input
                        type="checkbox"
                        id="roomLock"
                        className={`h-5 w-5 accent-blue-600 ${(roomMode==="admin" && !admin)?"cursor-not-allowed":"cursor-pointer"}`}
                        checked={roomLock}
                        onChange={(e) =>
                            setRoomLock(e.target.checked ? true : false)
                        }
                        disabled={roomMode==="admin" && !admin}
                    />
                </label>

                <label
                    htmlFor="chatEnable"
                    className={`w-full flex items-center justify-between rounded-xl border ${theme.border} ${theme.background2} p-4 transition hover:border-blue-400 ${(roomMode==="admin" && !admin)?"cursor-not-allowed":"cursor-pointer"}`}
                >
                    <div className="flex flex-col">
                        <p className={`font-semibold ${theme.text}`}>
                            Enable Chatting
                        </p>

                        <p className={`text-sm ${theme.icon_text}`}>
                            Users can communicate with each other.
                        </p>
                    </div>

                    <input
                        type="checkbox"
                        id="chatEnable"
                        className={`h-5 w-5 accent-blue-600 ${(roomMode==="admin" && !admin)?"cursor-not-allowed":"cursor-pointer"}`}
                        checked={chatEnable}
                        onChange={(e) =>
                            setChatEnable(e.target.checked ? true : false)
                        }
                        disabled={roomMode==="admin" && !admin}
                    />
                </label>

                <label
                    htmlFor="chatHistory"
                    className={`w-full flex items-center justify-between rounded-xl border ${theme.border} ${theme.background2} p-4 transition hover:border-blue-400 ${(roomMode==="admin" && !admin)?"cursor-not-allowed":"cursor-pointer"}`}
                >
                    <div className="flex flex-col">
                        <p className={`font-semibold ${theme.text}`}>
                            Enable Chat History
                        </p>

                        <p className={`text-sm ${theme.icon_text}`}>
                            New users can see previous chats.
                        </p>
                    </div>

                    <input
                        type="checkbox"
                        id="chatHistory"
                        className={`h-5 w-5 accent-blue-600 ${(roomMode==="admin" && !admin)?"cursor-not-allowed":"cursor-pointer"}`}
                        checked={chatHistory}
                        onChange={(e) =>
                            setChatHistory(e.target.checked ? true : false)
                        }
                        disabled={roomMode==="admin" && !admin}
                    />
                </label>

                {((roomMode==="admin" && admin) || (roomMode==="open")) && 
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${!dark?"hover:bg-slate-300 bg-slate-200 text-white":"hover:bg-slate-600 bg-slate-500"} `}
                        >
                            Cancel
                        </button>

                        <button
                            className={`px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600 bg-blue-500 text-white `}
                        >
                            Save
                        </button>
                    </div>
                }

                {roomMode==="admin" && !admin && 
                    <div className="mt-6 flex justify-center gap-3" >
                        <p className={`text-sm ${theme.icon_text}`}>
                            Only Admin can change the settings.
                        </p>
                    </div>
                }
            </form>

        </div>

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
  )
}

export default Settings
