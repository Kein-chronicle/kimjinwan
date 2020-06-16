import React, { useEffect, useState } from "react"
import useSession from 'react-session-hook';
import JwtDecode from 'jwt-decode';
import StackGrid from "react-stack-grid";
import api from '../../../models/api'
import Moment from 'moment'
import { Link } from 'react-router-dom'


function ListController() {
    return (
        <div>
            <Link to="/admin/controll">Write</Link>
        </div>
    )
}

function ItemView({item, sub}) {
    const [tags, setTags] = useState([])

    useEffect(()=>{
        if (item.tags) {
            var arr = []
            for (let i = 0; i < item.tags.length; i++) {
                const tag = item.tags[i];
                var btnStyle = " btn-secondary"
                if (sub === tag) {
                    btnStyle = " btn-light"
                }
                arr.push(<Link to={"/blog/list/"+tag} key={'tag'+i}><div style={{padding:'5px', margin:'5px', fontSize:'10px'}} className={"btn"+btnStyle}>{tag}</div></Link>)
            }
            setTags(arr)
        }
    }, [item.tags])


    const [imageView, setImageView] = useState("")
    const [desSec, setDesSec] = useState("")
    const [_at, setAt] = useState("")
    const imageUrl = "https://api.kimjinwan.com/"
    useEffect(()=>{
        if (item.file) {
            setImageView(<img alt={imageUrl + item.file.path} style={{width:'150px', height:'auto'}} src={imageUrl + item.file.path} />)
        }
        if (item.description) {
            const des = item.description
            if (des.length > 60) {
                setDesSec(des.slice(0, 60) + "...")
            } else {
                setDesSec(des)
            }
        }
        if (item._at) {
            setAt(Moment(item.at).format("YYYY-MM-DD hh:mm"))
        }
    }, [item])

    const itemWrap = {
        margin:'10px',
        padding:'15px',
        border: '1px solid gray',
        borderRadius: '10px'
    }
    const imageWrap = {
        margin:'10px'
    }
    const desWrap = {
        padding:"3px",
        textAlign:'center',
        color:'white',
        fontSize:'19px'
    }
    const atWrap = {
        textAlign:'right',
        color:'gray',
        fontSize:'11px'
    }
    return (
        <div style={itemWrap}>
            <Link to={"/blog/read/"+item._id}>
                <div style={imageWrap}>
                    {imageView}
                </div>
                <div style={desWrap}>
                    {desSec}
                </div>
            </Link>
            <div>
                {tags}
            </div>
            <div style={atWrap}>
                {_at}
            </div>
        </div>
    )
}

function ListPage(props) {
    const sub = props.match.params
    
    const session = useSession()
    const [admin, setAdmin] = useState(false)
    const [listItem, setListItem] = useState([])

    const listCall = () => {
        fetch(
            api.list.url,
            {
                method: api.list.method,
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin':'*'
                }),
            //   body: JSON.stringify({ password:password })
            }
        )
        .then(async response => {
            if (response.status === 200) {
                // 성공
                const data = await response.json();
                const items = data.data
                console.log(items);
                
                var arr = []
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    var tags = []
                    if (item.tags) {
                        tags = item.tags
                    }
                    if (sub.tag && sub.tag !== "All") {
                        if (tags.includes(sub.tag)) {
                            arr.push(<ItemView key={item._id} sub={sub.tag} item={item} />)
                        }
                    } else {
                        arr.push(<ItemView key={item._id} sub={"All"} item={item} />)
                    }
                }
                setListItem(arr)

            } else {
                // 실패
                alert("Who are you? Do not connect this page")
            }
        })
        .catch(error => console.log(error));
    }

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

    useEffect(()=>{
        listCall()
    },[sub])

    return (
        <div>
            {admin ? <ListController /> : null}
            <StackGrid columnWidth={220} >
                {listItem}
            </StackGrid>
        </div>
    )
}

export default ListPage