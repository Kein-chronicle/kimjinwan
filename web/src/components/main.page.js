import React from 'react'
import { Router, Switch, Route } from 'react-router'
import './css/main.css'

import Top from './top/top'

import MainDefault from './main.default.content'

import Intro from './content/intro'
import Stack from './content/stack'
import Histroy from './content/history'
import Service from './content/service'
import Idea from './content/idea'
import Contact from './content/contact'

function MainPage() {

    const wrapStyle = {
        paddingTop: "5rem"
    }

    return (
        <div style={wrapStyle} className="text-center">
            <Top />
            <Switch>
                <Route exact path="/intro" component={Intro} />
                <Route exact path="/stack" component={Stack} />
                <Route exact path="/history" component={Histroy} />
                <Route exact path="/service" component={Service} />
                <Route exact path="/idea" component={Idea} />
                <Route exact path="/contact" component={Contact} />
                <Route exact path="/" component={MainDefault} />
            </Switch>
        </div>
    )
}

export default MainPage