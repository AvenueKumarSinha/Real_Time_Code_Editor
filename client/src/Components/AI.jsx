import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import { useRef } from 'react';
import { useEffect } from 'react';

import { GiCancel } from "react-icons/gi";
import { IoCopy } from "react-icons/io5";

import { Tooltip } from 'react-tooltip';
import { socket } from '../socket';
import { toast } from 'react-toastify';

import Loader from './Loader';

import ReactMarkdown from "react-markdown"

const AI = ({open, onClose, dark, aiChats}) => {
    if(!open) return null;

    const [prompt, setPrompt]=useState("")
    const [loading, setLoading]=useState(false)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm();

    const chatEndRef=useRef(null);

    const scrollToBottom=()=>{
        chatEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    };

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
        prompt_icon: "white",
        prompt_icon_hover:"hover:bg-blue-600",
    };

    const onSubmit=async()=>{
        try{
            setLoading(true);
            socket.emit("send-prompt",({prompt:prompt}),(response)=>{
                if(response.error){
                    setLoading(false);
                    toast.error("We are unable to process your request at the moment, please try again later.");
                    return;
                }
                setPrompt("");
                setLoading(false);
            });

        }catch(err){
            setLoading(false);
            toast.error("Unable to send the prompt.");
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();   
            handleSubmit(onSubmit)();
        }
    };

    useEffect(()=>{
        scrollToBottom();
    }, [aiChats]);

    useEffect(()=>{
        if (open) setTimeout(scrollToBottom, 50);
    }, [open]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`} onClick={(e)=>{if(e.target===e.currentTarget) onClose()}} >
        <div className={`w-[700px] max-w-[95vw] h-[80vh] max-h-[850px] rounded-2xl ${theme.background} shadow-2xl border ${theme.border} p-6 ${theme.text} flex flex-col`} >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold">
                        AI Assistant
                    </h2>

                    <div className={`mt-2 px-3 py-2 rounded-lg border ${theme.border} ${theme.background2}`}>
                        <p className="text-xs opacity-80">
                            <span className="font-semibold">
                                Powered by Google AI
                            </span>
                        </p>

                        <p className="text-xs opacity-65 mt-1">
                            Model: <b>{import.meta.env.VITE_AI_MODEL}</b>
                        </p>

                        <p className="text-xs opacity-60 mt-1">
                            AI-generated content may contain mistakes. Please verify important information before relying on it.
                        </p>
                    </div>
                </div>
    
                <button
                    onClick={onClose}
                    className={`p-2 rounded-lg ${theme.icon_hover} ${theme.text}`}
                    data-tooltip-id="icon-tooltip"
                    data-tooltip-content="Close (Esc)"
                >
                    <GiCancel size={20} />
                </button>
            </div>

            <div className={`flex-1 rounded-xl border ${theme.border} ${theme.background2} p-3 overflow-y-auto`} >
                {aiChats.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">No AI chat yet.</div>
            ) : (
                <ul className="flex-1 overflow-y-auto my-5 space-y-4 pr-3">
                    {aiChats.map((chat, index) => {
                        const reply=chat.reply;

                        return (
                            <li
                                key={index}
                                className={`flex ${!reply ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow
                                        ${!reply?"bg-blue-500 text-white rounded-br-md":`${theme.background2} border ${theme.border} rounded-bl-md`}
                                    `}
                                >
                                    
                                    <div className="break-words whitespace-pre-wrap">
                                        <ReactMarkdown>{chat.content}</ReactMarkdown> 
                                    </div>


                                    <div
                                        className={`mt-2 text-[11px] flex justify-between ${
                                            !reply
                                                ? "text-blue-100 text-right"
                                                : `${theme.icon_text} text-right`
                                        }`}
                                    >
                                        <button
                                            className={`
                                                ${!reply?theme.prompt_icon_hover:theme.icon_hover}
                                                ${!reply?theme.prompt_icon:theme.icon_text}
                                                p-1.5
                                                rounded-md
                                            `}
                                            onClick={async()=>{
                                                try{
                                                    await navigator.clipboard.writeText(chat.content)
                                                }catch{
                                                    toast.error("Copy Failed")
                                                }
                                            }}
                                            data-tooltip-id="icon-tooltip"
                                            data-tooltip-content={`Copy ${reply?"reply":"prompt"}`}
                                            >
                                            {reply?<IoCopy size={14} />:<IoCopy size={12} />}
                                        </button>

                                        {new Date(chat.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            </li>
                        );
                    })}

                    <div ref={chatEndRef} />
                </ul>
            )}
            </div>

            <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-auto pt-4"
        >
            <div className="flex gap-3 items-center">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    rows={3}
                    className={`w-full resize-none rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition scrollbar-none [&::-webkit-scrollbar]:hidden ${theme.background2} `}
                    required
                />

                {loading && <Loader size="h-6 w-6" color={!dark?`border-t-gray-400`:`border-t-white`} backgroundColor={!dark?`border-gray-300`:`border-gray-500`} />}
                {!loading && <button
                    type="submit"
                    className="h-11 md:h-12 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition whitespace-nowrap"
                >
                    {isSubmitting?"Sending...":"Send"}
                </button>}
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

export default AI
