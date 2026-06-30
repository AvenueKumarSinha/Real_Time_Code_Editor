import React from 'react'

import { GiCancel } from "react-icons/gi";

import { Tooltip } from 'react-tooltip';

const Keyboard = ({open, onClose, dark}) => {
    if(!open) return null;

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

    const shortcuts = [
        {
            title: "General",
            items: [
                ["Ctrl + \\", "Open Keyboard Shortcuts"],
                ["Esc", "Close Current Dialog Box"],
                ["Ctrl + Shift + D", "Toggle Theme"],
            ],
        },
        {
            title: "Editor",
            items: [
                ["Ctrl + '", "Run Code"],
                ["Ctrl + .", "Reset Code"],
            ],
        },
        {
            title: "Room",
            items: [
                ["Ctrl + Shift + M", "Open Chat"],
                ["Ctrl + ,", "Open Settings"],
                ["Ctrl + Shift + C", "Copy Room ID"],
                ["Alt + N", "Toggle Notifications"],
            ],
        },
        {
            title: "Chat",
            items: [
                ["Enter", "Send Message"],
            ],
        },
    ];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm`} >
        <div className={`w-[720px] max-w-[95vw] h-[80vh] max-h-[850px] rounded-2xl ${theme.background} shadow-2xl border ${theme.border} flex flex-col overflow-hidden`} >
            <div className={`flex items-center justify-between border-b ${theme.border} ${theme.text} px-6 py-5`} >
                <h2 className="text-2xl font-bold">
                    Keyboard Shortcuts
                </h2>

                <button
                    onClick={onClose}
                    className={`p-2 rounded-lg ${theme.icon_hover} ${theme.text}`}
                    data-tooltip-id="icon-tooltip"
                    data-tooltip-content="Close (Esc)"
                >
                    <GiCancel size={20}/>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
                {shortcuts.map((section)=>(
                    <div key={section.title}>
                        <h3 className={`text-lg font-semibold mb-4 ${theme.icon_text}`}>{section.title}</h3>

                        <div className={`rounded-xl border ${theme.border} overflow-hidden`}>
                            {section.items.map(([key,action],index)=>(
                                <div
                                    key={key}
                                    className={`flex justify-between items-center px-5 py-4
                                    ${
                                        index!==section.items.length-1
                                        ? `border-b ${theme.border}`
                                        : ""
                                    }`}
                                >

                                <span className={`font-medium ${theme.text}`}>{action}</span>

                                <div className="flex gap-1 flex-wrap">
                                    {key.split(" + ").map((k)=>(
                                        <kbd
                                            key={k}
                                            className={`px-3 py-1 rounded-md border ${theme.border} ${theme.background2} ${theme.text} font-mono text-sm shadow-sm`}
                                        >
                                            {k}
                                        </kbd>
                                    ))}

                                </div>

                        </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
    
    </div>
  )
}

export default Keyboard
