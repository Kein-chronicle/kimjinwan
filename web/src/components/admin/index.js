import React from "react"
import {Switch, Route} from 'react-router-dom'

import Login from './login'
// import List from '../content/blog/list'
import Controll from './controller'

import NotFound from '../not.found'

function AdminLogin() {
    return (
        <div>
            <Switch>
                <Route exact path="/admin/login" component={Login} />
                {/* <Route exact path="/admin/list" component={List} /> */}
                <Route exact path="/admin/controll" component={Controll} />
                <Route path="/admin" component={NotFound} />
            </Switch>
        </div>
    )
}

export default AdminLogin