import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Room from "./Room";


function App() {

  return (
    <BrowserRouter>
      <Routes>
          <Route exact path="/" element={<Home />} />
          <Route exact path="/room/:user/:room" element={<Room />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
