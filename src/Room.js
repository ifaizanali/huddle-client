import React, { useEffect, useState } from 'react'
import './Room.css'
import {
  useParams
} from "react-router-dom";
import { Peer } from 'peerjs'
import { io } from "socket.io-client";
import axios from "axios"



function Room() {
  let { user, room } = useParams();
  const ref = React.useRef(null);
  const streamRef = React.useRef(null)
  const [audio, setaudio] = useState(true)
  const [video, setvideo] = useState(true)
  const [screen, setscreen] = useState(false)
  const [shares, setshares] = useState([])
  const [calls, setcalls] = useState([])
  const screenRef = React.useRef(null)
  const peerRef = React.useRef(null)
  const callRef = React.useRef(null)
  callRef.current = calls
  const socket = io("https://3.80.106.177:3000")
  const getScreenRef = React.useRef(null)
  getScreenRef.current = shares

  function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    document.getElementById('video-grid').append(video)
  }

  useEffect(async () => {

    await axios.get(`https://3.80.106.177:3000/stop-screen/${room}/${user}`).then(res => {
        console.log("deleting: ",res.data)
    })

    await axios.get(`https://3.80.106.177:3000/get-screen/${room}`).then(res => {
            console.log("users sharing: ",res.data)
            setshares(res.data.users)
          })

   const peer = new Peer(user, {
    host: "0.peerjs.com",
    port: 443,
    path: "/",
    pingInterval: 5000,
  });


  peer.on('open', id => {
    console.log("pear id: ",id)
    startCall()
    socket.emit('join-room', room, id, "peer")
  })


  peerRef.current = peer


  console.log("peer: ", peer)


  function connectToNewUser(userId, stream) {
    console.log('new', screenRef.current)
    const call = peer.call(userId, stream)
    if(screenRef.current !== null)
    {
      const ms = screenRef.current.getVideoTracks()[0]
      let sender = call.peerConnection.getSenders()[2]
      sender.replaceTrack(ms)
    }
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      setcalls(old => [...old, call])
      addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
      video.remove()
    })
  }


  function startCall(){
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      const myVideo = document.createElement('video')
      const ms = stream.clone()
      const t = stream.getVideoTracks()[0].clone()
      ms.addTrack(t)
      streamRef.current = ms
      addVideoStream(myVideo, ms)
      peer.on('call',  call => {
        call.answer(ms)
        const video = document.createElement('video')
        const visited = []
        call.on('stream', async userVideoStream => {
          setcalls(old => [...old, call])
          addVideoStream(video, userVideoStream)
          console.log(getScreenRef.current)
          console.log(call.peer)
          console.log(getScreenRef.current.includes(call.peer))
          getScreenRef.current.forEach(k => {
              if(k === call.peer && !visited.includes(k))
              {
                const video = document.createElement('video')
                video.id = call.peer
                const ms = new MediaStream([call.peerConnection.getReceivers()[2].track])
                addVideoStream(video, ms)
                visited.push(k)
              }
          })

        })
        call.on('close', () => {
          video.remove()
        })
      })

      socket.on('user-connected', userId => {
        connectToNewUser(userId, ms)
      })

    })
  }

    socket.on('user-disconnected', userId => {
      peer.connections[userId][0].close()
      const arr = [...calls]
      const arr1 = []
      arr.forEach(i => {
        if(i.peer !== userId)
          arr1.push(i)
      })
      setcalls(arr1)
    })

    socket.on('screen-disconnected', userId => {
      document.getElementById('video-grid').removeChild(document.getElementById(userId))
    })


    socket.on('share-screen', async userId => {
      console.log("new screen: ", userId)
      const myVideo = document.createElement('video')
      myVideo.id = userId
      console.log(callRef.current)
      let count = 0
      callRef.current.forEach(i => {
        console.log(i.peer)
        if(i.peer === userId && count === 0)
        {
          const ms = new MediaStream([i.peerConnection.getReceivers()[2].track])
          addVideoStream(myVideo, ms)
          count++
        }
      })
    })



  }, [])


    const handleToggleAudio = () => {
      streamRef.current.getAudioTracks()[0].enabled = !streamRef.current.getAudioTracks()[0].enabled
      setaudio(!audio)
    };

    const handleToggleVideo = () => {
      streamRef.current.getVideoTracks()[0].enabled = !streamRef.current.getVideoTracks()[0].enabled
      setvideo(!video)
    };


    async function startScreen(){
      await axios.get(`https://3.80.106.177:3000/start-screen/${room}/${user}`).then(res => {
        console.log("starting:", res.data)
      })
      await navigator.mediaDevices.getDisplayMedia().then(stream => {
        const myVideo = document.createElement('video')
        myVideo.id = peerRef.current.id
        screenRef.current = stream
        addVideoStream(myVideo, stream)
        const ms = stream.getVideoTracks()[0]
        const visited = []
        calls.forEach(i => {
          if (!visited.includes(i.peer))
          {
            console.log(i.peer)
            let sender = i.peerConnection.getSenders()[2]
            sender.replaceTrack(ms)
            visited.push(i.peer)
          }
        })
      })
    }


    async function handleToggleScreen()  {
      if(!screen){
        await startScreen()
        socket.emit('start-screen-share', room, user)
      }
      else{
        screenRef.current.getTracks().forEach(track => track.stop())
        socket.emit('stop-screen-share', room, peerRef.current.id)
        screenRef.current = null;
        await axios.get(`https://3.80.106.177:3000/stop-screen/${room}/${user}`).then(res => {
          console.log("deleting: ",res.data)
        })
      }
      setscreen(!screen)
    };


  return (
    <>
      <div id='video-grid' ref={ref}></div>
      <div className='controls'>
        <button onClick={handleToggleAudio}>{audio ? 'Mute' : 'Unmute'}</button>
        <button onClick={handleToggleVideo}>{video ? 'Stop Video' : 'Start Video'}</button>
        <button onClick={handleToggleScreen}>{screen ? 'Stop Screen' : 'Start Screen'}</button>
      </div>
    </>
  )
}

export default Room
