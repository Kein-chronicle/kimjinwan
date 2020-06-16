import React from 'react'
import { Switch, Route } from 'react-router'
import { useSelector } from 'react-redux';

import Tags from './tags'
import ListPage from './list'
import ReadPage from './read'

import NotFound from '../../not.found'

function Blog(props) {
    const sub = props.match.params

    const show = useSelector(state => state.dataStore)
    // console.log(sub);
    return (
        <div>
            <div style={{padding:'20px', display: show.showTops ? 'block' : 'none'}}>
                Blog About ...
            </div>
            <Tags show={show.showTops} sub={sub.index} />
            <Switch>
                <Route exact path="/blog/list/:tag?" component={ListPage} />
                <Route exact path="/blog/read/:index" component={ReadPage} />
                <Route path="/blog" component={NotFound} />
            </Switch>
        </div>
    )
}

export default Blog