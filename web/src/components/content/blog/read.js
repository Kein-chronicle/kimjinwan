import React, { useEffect, useState } from 'react'
import JwtDecode from 'jwt-decode';
import useSession from 'react-session-hook';
import api from '../../../models/api'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux';
import Moment from 'moment'

import NotFound from '../../not.found'

function Constent({item}) {
    const [tags, setTags] = useState([])
    const [dateText, setDateText] = useState("")
    const [description, setDescription] = useState("")
    useEffect(()=>{
        if (item.tags) {
            var arr = []
            for (let i = 0; i < item.tags.length; i++) {
                const tag = item.tags[i];
                const btnStyle = " btn-secondary"
                arr.push(<Link to={"/blog/list/"+tag} key={'tag'+i}><div style={{padding:'5px', margin:'5px'}} className={"btn"+btnStyle}>{"#"+tag}</div></Link>)
            }
            setTags(arr)
        }
    }, [item.tags])

    useEffect(()=>{
        setDateText(Moment(item._at).format("YYYY-MM-DD hh:mm:ss"))
    }, [item._at])

    useEffect(()=>{
        var newDes = item.description + ""
        newDes = newDes.replace(/\n/g, "<br />")
        setDescription(newDes)
    }, [item.description])
    return (
        <div>
            {item.file 
                ? 
                <div style={{padding:'20px'}}>
                    <a href={"https://api.kimjinwan.com/"+item.file.path} target="_blank">
                        <img style={{maxWidth:'80%', maxHeight:'250px'}} src={"https://api.kimjinwan.com/"+item.file.path} />
                    </a>
                </div>
                :
                null
            }
            <div style={{fontSize:'20px'}} className="d-flex">
                <div className="flex-grow-1"></div>
                <div style={{maxWidth:'80%', marginTop:'5rem', marginBottom:'5rem', overflow:'hidden'}} dangerouslySetInnerHTML={ {__html: description} } />
                <div className="flex-grow-1"></div>
            </div>
            <div style={{color:'gray', fontSize:'13px'}}>
                {dateText}
            </div>
            <div style={{fontSize:'20px'}} className="d-flex mt-3">
                <div className="flex-grow-1"></div>
                <div>
                    <div style={{fontSize:'14px'}}>Tags</div>
                    {tags}
                </div>
                <div className="flex-grow-1"></div>
            </div>
        </div>
    )
}

function Read(props) {
    const session = useSession()
    const [admin, setAdmin] = useState(false)
    const dispatch = useDispatch()

    useEffect(()=>{
        if (session.token === undefined) {
            setAdmin(false)
        } else {
            const userInfo = JwtDecode(session.token)
            if (userInfo.admin === false) {
                setAdmin(false)
            } else {
                setAdmin(true)
            }
        }
    }, [session.token])


    const params = props.match.params
    const [notFound, setNotFound] = useState(false)
    const [_id, setId] = useState("")
    const [item, setItem] = useState({})

    useEffect(()=>{
        if (params.index && params.index !== "") {
            setId(params.index)
        } else {
            setNotFound(true)
        }
    }, [params, setId, setNotFound])

    useEffect(()=>{
        blogDataCall()
    }, [_id])

    useEffect(()=>{
        dispatch({type:'DATASET', showTops: false})
        
        return () => {
            dispatch({type:'DATASET', showTops: true})
        }
    }, [])
    

    const blogDataCall = () => {
        if (_id === "") {
            return
        }
        fetch(
            api.read.url,
            {
                method: api.read.method,
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin':'*'
                }),
              body: JSON.stringify({ _id:_id })
            }
        )
        .then(async response => {
            if (response.status === 200) {
                // 성공
                const data = await response.json();
                const getItem = data.data
                setItem(getItem)
            } else {
                // 실패
                alert("Who are you? Do not connect this page")
            }
        })
        .catch(error => {
            setNotFound(true)
            console.log(error)
        });
    }

    // const [contentView, setContentView] = useState(null)

    return (
        <div>
            {admin ? "admin controller" : null}
            <Link to="/blog/list">
                <div style={{color:'white', fontSize:'20px'}}>
                    to list
                </div>
            </Link>
            {notFound 
            ?
                NotFound
            :
                <Constent item={item} />
            }
            <Link to="/blog/list">
                <div style={{color:'white', fontSize:'20px', marginTop:"3rem"}}>
                    to list
                </div>
            </Link>
        </div>
    )
}

export default Read