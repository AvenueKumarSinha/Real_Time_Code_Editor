import React from 'react'

const DesktopRequired = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-100 px-6">
        <div className="max-w-lg text-center bg-white shadow-lg rounded-2xl p-8">
            <div className="text-6xl mb-4">💻</div>

            <h1 className="text-3xl font-bold">
                Larger Screen Required
            </h1>

            <p className="mt-4 text-slate-600">
                Real Time Code Editor is designed for
                laptops and desktop computers.

                Please open this room on a screen
                at least <b>1090px wide and 650px height</b> for the
                best experience.
            </p>
        </div>
    </div>
  )
}

export default DesktopRequired
