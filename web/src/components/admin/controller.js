import React, { useEffect, useState } from "react"
import useSession from 'react-session-hook';
import JwtDecode from 'jwt-decode';
import api from '../../models/api'
import { useHistory } from 'react-router-dom';

function ControllPage() {
    const history = useHistory()
    const session = useSession()
    const userInfo = JwtDecode(session.token)
    useEffect(()=>{
        if (session.token === undefined || userInfo.admin === false) {
            window.location = "/admin/login"
        }
    })

    const [description, setDescription] = useState("")
    const [file, setFile] = useState(null)

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
                const btnStyle = " btn-secondary"
                arr.push(<button key={'tag'+i} onClick={()=>{addTags(tag.tag)}} style={{padding:'5px', margin:'5px'}} className={"btn"+btnStyle}>{tag.tag}</button>)
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
    },[])

    const [tagArr, setTagArr] = useState([])
    const [selectedTags, setSelectedTags] = useState([])
    
    const addTags = (tag) => {
        if (!tagArr.includes(tag)) {
            const arr = tagArr
            arr.push(tag)
            setTagArr(arr)
            arrChanged()
        }
    }

    const removeTags = (tag) => {
        var arr = tagArr
        var index = null
        for (let i = 0; i < tagArr.length; i++) {
            const item = tagArr[i];
            if (item === tag) {
                index = i
                break
            }
        }
        if (index !== null) {
            arr.splice(index, 1);
            setTagArr(arr)
            arrChanged()
        }
    }
    
    const arrChanged = () => {
        var arr = []
        for (let i = 0; i < tagArr.length; i++) {
            const tag = tagArr[i];
            const btnStyle = " btn-light"
            arr.push(<button key={'selectTag'+i} onClick={()=>{removeTags(tag)}} style={{padding:'5px', margin:'5px'}} className={"btn"+btnStyle}>{tag}</button>)
        }
        setSelectedTags(arr)
    }

    const [inputTag, setInputTag] = useState("")

    const inputBtnOnClick = () => {
        if (inputTag === "") {
            return
        }
        addTags(inputTag)
        setInputTag("")
    }

    const writeProc = () => {
        var formData = new FormData()

        if (tagArr.length !== 0) {
            for (let i = 0; i < tagArr.length; i++) {
                const tag = tagArr[i];
                formData.append("tags["+i+"]",tag)
            }
        }
        if (description !== "") {
            formData.append("description",description)
        }
        if (file !== null) {
            formData.append("file",file, file.name)
        }
        fetch(
            api.write.url,
            {
                method: api.write.method,
                headers: new Headers({
                    // 'Accept': 'application/form-data',
                    // 'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin':'*',
                    'x-access-token': session.token
                }),
              body: formData //JSON.stringify(formData)
            }
        )
        .then(async response => {
            if (response.status === 200) {
                // 성공
                // const data = await response.json();
                history.push("/blog/list/All")
                
            } else {
                // 실패
                alert("Who are you? Do not connect this page")
            }
        })
        .catch(error => {
            console.log(error)
        });
    }

    return (
        <div>
            <div className="d-flex">
                <div className="flex-grow-1"></div>
                <div style={{maxWidth:'50%', width:'500px', textAlign:'left'}}>
                    <div className="input-group mb-3">
                        <div className="input-group-prepend">
                            <span className="input-group-text" id="inputGroupFileAddon01">Upload</span>
                        </div>
                        <div className="custom-file">
                            <input onChange={e=>setFile(e.target.files[0])} type="file" className="custom-file-input" id="inputGroupFile01" />
                            <label className="custom-file-label" htmlFor="inputGroupFile01">Choose file</label>
                        </div>
                    </div>
                </div>
                <div className="flex-grow-1"></div>
            </div>
            <div className="d-flex">
                <div className="flex-grow-1"></div>
                <div style={{maxWidth:'50%', width:'500px'}}>
                    <textarea className="form-control" style={{height:'400px'}} onChange={e=>setDescription(e.target.value)}></textarea>
                </div>
                <div className="flex-grow-1"></div>
            </div>
            <div style={{marginTop:'2rem'}}>
                {selectedTags}
            </div>
            <div className="d-flex" style={{marginTop:'2rem'}}>
                <div className="flex-grow-1"></div>
                <div style={{maxWidth:'50%', width:'500px'}}>
                    <input type="text" className="form-control" style={{textAlign:'center'}} onChange={e=>setInputTag(e.target.value)} placeholder="tag" value={inputTag} />
                    <button className="btn btn-secondary" style={{marginTop:'20px'}} onClick={()=>{inputBtnOnClick()}} >Add</button>
                </div>
                <div className="flex-grow-1"></div>
            </div>
            <div style={{marginTop:'1rem'}}>
                {tags}
            </div>
            <div>
                <button className="btn btn-primary" onClick={()=>{writeProc()}}>Complete</button>
            </div>
        </div>
    )
}

export default ControllPage