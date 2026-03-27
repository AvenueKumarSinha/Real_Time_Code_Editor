import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";

import { socket } from "../socket";

const HomePage = () => {
  const navigate=useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = (data) => {
    if(createRoom){
        console.log(data.username)
        const room=Math.floor(Math.random()*(999999999-100000000))+100000000;
        console.log("Room id: ",room);
        navigate(`code?room=${room}&username=${data.username}`)
      }else{
        console.log(data.username)
        console.log(data.room)
        navigate(`code?room=${Number(data.room)}&username=${data.username}`)
    }
  };

  const[createRoom,setCreateRoom]=useState(false)

  return (
    <div className="bg-[rgb(242,242,242)] h-screen w-screen flex flex-col">
      <div className="m-auto flex flex-col gap-[1vh]" >
        <h1 className="m-auto text-5xl font-bold">Real Time Code Editor</h1>
        <h5 className="m-auto text-2xl">Collaborate. Code. Execute.</h5>
      </div>

        <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-[rgb(238,238,238)] shadow-(color:rgb(238,238,238)) shadow-md h-3/4 w-3/4 m-auto flex flex-col justify-center items-center gap-[5vh] rounded-[15px]"
        >
            <input
            {...register("username")}
            type="text"
            placeholder="Please enter your username"
            className="home_input"
            />

            {createRoom && 
                <>
                <button
                disabled={isSubmitting}
                type="submit"
                className="bg-cyan-500 shadow-lg shadow-cyan-500/50 hover:bg-cyan-600 w-[30%] h-[7%] rounded-[10px] text-white font-bold"
                >
                Create Room
                </button>
                <p className="font-bold text-xl" >OR</p>
                <button
                disabled={isSubmitting}
                type="button"
                className="bg-lime-500 shadow-lg shadow-lime-500/50 hover:bg-lime-600 w-[30%] h-[7%] rounded-[10px] text-white font-bold"
                onClick={()=>{setCreateRoom(false)}}
                >
                Join Room
                </button>
                </>
            }

            {!createRoom && 
                <>
                <input
                {...register("room")}
                type="text"
                placeholder="Please enter your room id"
                className="home_input"
                />
                <button
                disabled={isSubmitting}
                type="submit"
                className="bg-lime-500 shadow-lg shadow-lime-500/50 hover:bg-lime-600 w-[30%] h-[7%] rounded-[10px] text-white font-bold"
                >
                Join Room
                </button>
                <p className="font-bold text-xl" >OR</p>
                <button
                disabled={isSubmitting}
                type="button"
                className="bg-cyan-500 shadow-lg shadow-cyan-500/50 hover:bg-cyan-600 w-[30%] h-[7%] rounded-[10px] text-white font-bold"
                onClick={()=>{setCreateRoom(true)}}
                >
                Create Room
                </button></>
            }
            {/* Add Loader-> {isSubmitting && <Loader/>} */}
        </form>
    </div>
  );
};

export default HomePage;
