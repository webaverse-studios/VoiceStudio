import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './home.css';

const Home = () => {

  let navigate = useNavigate();

  return (
    <div className='home'>
        <button className="btn btn-green" onClick={() => {navigate("/record")}}>Create a New Persona</button>
        <button className="btn btn-orange">Continu with me</button>
    </div>
  );

}

export default Home