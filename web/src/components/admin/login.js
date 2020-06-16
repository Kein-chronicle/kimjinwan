import React, { useState } from "react"
import useSession from 'react-session-hook'
import { useHistory } from 'react-router-dom';

import api from '../../models/api'

function LoginPage() {
    const [password, setPassword] = useState("")
    const history = useHistory()
    const session = useSession()

    const handleLogin = (token) => session.setSession({token:token})

    const login = () => {
        if (password === "wlsdhks2@@") {
            console.log("login complete");
            
            
        }
        fetch(
            api.login.url,
            {
              method: api.login.method,
              headers: new Headers({
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin':'*'
              }
              ),
              body: JSON.stringify({ password:password })
            }
          )
          .then(async response => {
            if (response.status === 200) {
              // 성공
              const data = await response.json();
              handleLogin(data.token)
              history.push("/blog/list")
            } else {
              // 실패
              alert("Who are you? Do not connect this page")
            }
          })
          .catch(error => console.log(error));
    }

    return (
        <div className="d-flex">
            <div className="flex-grow-1"></div>
            <div>
                <input type="password" onChange={(e)=>{setPassword(e.target.value)}} style={{width:'100px'}} className="form-control" />
                <br />
                <button className="btn btn-secondary" onClick={()=>login()} >로그인</button>
            </div>
            <div className="flex-grow-1"></div>
        </div>
    )
}

export default LoginPage