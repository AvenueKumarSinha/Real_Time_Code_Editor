import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";

import { socket } from "../socket";
import { toast } from "react-toastify";

const HomePage = () => {
  const navigate=useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async(data) => {
    if(createRoom){
      let tries=0;
      while(true){
          tries++;
          if(tries===15){
            toast.error("Unable to generate a valid room id, please try again later.");
            navigate("/");
            return;
          } 

          const room=Math.floor(Math.random()*(999999999-100000000))+100000000;

          const res=await fetch(`${import.meta.env.VITE_SERVER_URL}/checkDuplicateRoom`,{
            method:"POST",
            headers:{
              "Content-type":"application/json"
            },
            body: JSON.stringify({room:room})
          })

          const result=await res.json();
          if(result.duplicate==="true") continue;
          navigate(`code?room=${room}&username=${data.username}`)
          break;
        }
      }else{
        const res1=await fetch(`${import.meta.env.VITE_SERVER_URL}/checkRoomExists`,{
          method:"POST",
          headers:{
            "Content-type":"application/json"
          },
          body: JSON.stringify({room:data.room})
        })

        const result1=await res1.json();

        if(result1.exists==="false"){
          toast.error("The room with the submitted room id doesn't exist.");
          return;
        }

        const res2=await fetch(`${import.meta.env.VITE_SERVER_URL}/checkDuplicateUsername`,{
          method:"POST",
          headers:{
            "Content-type":"application/json"
          },
          body: JSON.stringify({room:data.room,username:data.username})
        })

        const result2=await res2.json();
        if(result2.duplicate==="true"){
          toast.error(`Username already exists in this room`);
          return;
        }

        navigate(`code?room=${Number(data.room)}&username=${data.username}`)
    }
  };

  const[createRoom,setCreateRoom]=useState(false)

  return (
    <div className="bg-slate-50 h-screen w-screen flex flex-col">
      <div className="mt-20 flex flex-col items-center gap-3" >
        <h1 className="text-6xl font-extrabold text-slate-900">Real Time Code Editor</h1>
        <h5 className="text-xl text-slate-500 font-medium">Collaborate. Code. Execute.</h5>
      </div>

        <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white shadow-xl border border-slate-200 w-[500px] max-w-[90vw] p-10 rounded-2xl mx-auto my-auto flex flex-col justify-center items-center gap-6"
        >
            <div className="text-center mb-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {createRoom ? "Create a Room" : "Join a Room"}
              </h2>

              <p className="text-slate-500 mt-1">
                Start collaborating instantly
              </p>
            </div>

            <input
            {...register("username")}
            type="text"
            placeholder="Please enter your username"
            className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
            />

            {createRoom && 
                <>
                  <input
                  {...register("room")}
                  type="text"
                  placeholder="Please enter the room id"
                  className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition invisible"
                  disabled
                  />
                  <button
                  disabled={isSubmitting}
                  type="submit"
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                  >
                  {isSubmitting ? "Creating..." : "Create Room"}
                  </button>
                  
                  <div className="flex items-center w-full">
                    <div className="flex-1 border-t border-slate-300"></div>

                    <span className="px-3 text-slate-400 text-sm">
                      OR
                    </span>

                    <div className="flex-1 border-t border-slate-300"></div>
                  </div>

                  <button
                  disabled={isSubmitting}
                  type="button"
                  className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold transition"
                  onClick={()=>{setCreateRoom(false)}}
                  >
                  {isSubmitting ? "Joining..." : "Join Room"}
                  </button>
                </>
            }

            {!createRoom && 
                <>
                <input
                {...register("room")}
                type="text"
                placeholder="Please enter the room id"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
                <button
                disabled={isSubmitting}
                type="submit"
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                >
                {isSubmitting ? "Joining..." : "Join Room"}
                </button>

                <div className="flex items-center w-full">
                  <div className="flex-1 border-t border-slate-300"></div>

                  <span className="px-3 text-slate-400 text-sm">
                    OR
                  </span>

                  <div className="flex-1 border-t border-slate-300"></div>
                </div>

                <button
                disabled={isSubmitting}
                type="button"
                className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold transition"
                onClick={()=>{setCreateRoom(true)}}
                >
                {isSubmitting ? "Creating..." : "Create Room"}
                </button>
              </>
            }
            <p className="text-sm text-slate-400 text-center">Share room IDs to collaborate with others.</p>
        </form>
    </div>
  );
};

export default HomePage;
