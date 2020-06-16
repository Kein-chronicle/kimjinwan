import React, { useState, useEffect } from 'react'
import api from '../../../models/api'
import { Link } from 'react-router-dom'

function Tags({sub, show}) {
    const [tags, setTags] = useState([])

    const callTags = () => {
        fetch(
            api.tags.url,
            {
              method: api.tags.method,
              headers: new Headers({
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin':'*'
              }
              ),
            //   body: JSON.stringify({ password:password })
            }
          )
          .then(async response => {
            if (response.status === 200) {
              // 성공
              const data = await response.json();
              const getTags = data.data
              getTags.unshift({tag:"All"})
              var arr = []
              for (let i = 0; i < getTags.length; i++) {
                const tag = getTags[i];
                var btnStyle = " btn-secondary"
                if (sub && sub === tag.tag) {
                    btnStyle = " btn-light"
                }
                arr.push(<Link to={"/blog/list/"+tag.tag} key={'tag'+i}><div style={{padding:'5px', margin:'5px'}} className={"btn"+btnStyle}>{tag.tag}</div></Link>)
              }
              setTags(arr)

            } else {
              // 실패
              alert("Who are you? Do not connect this page")
            }
          })
          .catch(error => console.log(error));
    }

    useEffect(()=>{
        callTags()
    },[sub])

    return (
        <div className="row mb-5" style={{margin:'0px', display: show ? "block" : "none"}}>
            <div className="col"></div>
            {tags}
            <div className="col"></div>
        </div>
    )
}
export default Tags