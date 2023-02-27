import React from "react";
import './Home.css';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";


function Home() {

  const [userId, setuserId] = useState("");
  const [roomId, setroomId] = useState("");
  const [newroomId, setnewroomId] = useState("");

  async function fetchUserId(){
    const user_id = localStorage.getItem('userId')
    if(user_id === null)
    {
      await axios.get(`https://3.80.106.177:3000/get-id`)
      .then(response => {
        setuserId(response.data['id']);
        localStorage.setItem('userId', response.data['id']);
      })
    }
    else{
      setuserId(user_id)
    }
  }

  async function getRoomId(){
    await axios.get(`https://3.80.106.177:3000/get-id`)
      .then(response => {
        setnewroomId(response.data['id']);
      })
  }

  async function newUserId(){
    await axios.get(`https://3.80.106.177:3000/get-id`)
      .then(response => {
        setuserId(response.data['id']);
        localStorage.setItem('userId', response.data['id']);
      })
  }

  useEffect(() => {
    fetchUserId()
    getRoomId()
  }, [])


  return (
    <div className="Home">
      <p>User Id:</p>
      <input type="text" readOnly value={userId} />
      <button onClick={newUserId}>New ID</button>
      <br/><br/>
      <Link to={`/room/${userId}/${newroomId}`}><button>Create Room</button></Link>
      <br/><br/>
     <form>
      <input type="text" placeholder="Room UUID" onChange={event => setroomId(event.target.value)} value={roomId}/>
      <Link to={`/room/${userId}/${roomId}`}><button>Join Room</button></Link>
     </form>
    </div>
  );
}

export default Home;
