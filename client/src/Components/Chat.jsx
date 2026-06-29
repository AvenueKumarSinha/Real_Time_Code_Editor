import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import { useRef } from 'react';
import { useEffect } from 'react';

import { GiCancel } from "react-icons/gi";

import { Tooltip } from 'react-tooltip';
import { socket } from '../socket';
import { toast } from 'react-toastify';

const Chat = ({open, onClose, dark, messages, username}) => {
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

    const [chat,setChat]=useState("");

    const messagesEndRef = useRef(null);

    const onSubmit=async()=>{
        try{
            socket.emit("send-chat",({message:chat}));
            setChat("");
        }catch(err){
            toast.error("Unable to send chat");
        }
    }

    const scrollToBottom=()=>{
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    };

    useEffect(()=>{
        scrollToBottom();
    }, [messages]);

    useEffect(()=>{
        if (open) setTimeout(scrollToBottom, 50);
    }, [open]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`} >
      <div className={`w-[700px] max-w-[95vw] h-[80vh] max-h-[850px] rounded-2xl ${theme.background} shadow-2xl border ${theme.border} p-6 ${theme.text} flex flex-col`} >
        <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold">
                Chat
            </h2>

            <button
                onClick={onClose}
                className={`p-2 rounded-lg ${theme.icon_hover} ${theme.text}`}
                data-tooltip-id="icon-tooltip"
                data-tooltip-content="Close Chat"
            >
                <GiCancel size={20} />
            </button>
        </div>

         <div className={`flex-1 rounded-xl border ${theme.border} ${theme.background2} p-3 overflow-y-auto`}>
            {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">No messages yet.</div>
            ) : (
                <ul className="flex-1 overflow-y-auto my-5 space-y-4 pr-3">
                    {messages.map((message, index) => {
                        const isMine = message.username === username;

                        return (
                            <li
                                key={index}
                                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow
                                        ${isMine?"bg-blue-500 text-white rounded-br-md":`${theme.background2} border ${theme.border} rounded-bl-md`}
                                    `}
                                >
                                    
                                    <div className={`text-xs font-semibold mb-1 ${isMine? "text-blue-100": theme.icon_text}`}>
                                        {message.username}
                                    </div>

                                    
                                    <div className="break-words whitespace-pre-wrap">
                                        {message.message}
                                    </div>

                                    <div
                                        className={`mt-2 text-[11px] ${
                                            isMine
                                                ? "text-blue-100 text-right"
                                                : `${theme.icon_text} text-right`
                                        }`}
                                    >
                                        {new Date(message.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            </li>
                        );
                    })}

                    <div ref={messagesEndRef} />
                </ul>
            )}
            </div>


        <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-auto pt-4 border-t border-slate-300"
        >
            <div className="flex gap-3 items-center">
                <input
                    value={chat}
                    onChange={(e)=>setChat(e.target.value)}
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 h-12 px-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    required
                />

                <button
                    type="submit"
                    className="h-12 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition whitespace-nowrap"
                >
                    Send
                </button>
            </div>
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

export default Chat
