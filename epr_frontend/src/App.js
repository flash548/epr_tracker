import React from 'react';
import EPRTable from './EPRTable';
import './App.css';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = { 
        userid : 0,
        amnData: {},
        firstname: props.firstname,
        lastname: props.lastname
    }
    
    // local hack I made to be able to pump props in...
    if (!(props.firstname && props.lastname)) {
      let matches = window.location.search.match(/\?firstname=(.+)&lastname=(.+)/)
      if (matches) {
        this.state['firstname'] = matches[1];
        this.state['lastname'] = matches[2];
      }
    }
  }

  // get userid from passed in firstname and lastname
  async componentDidMount() {
    var userid = 0;
    var amnData = {};
    try {
      var data = await fetch(`http://localhost:3000/user?firstname=${this.state.firstname}&lastname=${this.state.lastname}`);
      userid = await data.json();
      data = await fetch(`http://localhost:3000/getRecord?userid=${userid.user_id}`);
      amnData = await data.json();      
    }
    catch (e) { 
      amnData = {
        raterInfo : {
            user_id : '',
            username : '',
            fname : 'Error',
            mi : '',
            lname : '',
            rank : '',
            epr_last_done : '',
            epr_next_due : '',
            aca_last_done : '',
            aca_next_due : '',
        },
        subordinates: {
            data: {
                user_id : '',
                username : '',
                fname : 'Error',
                mi : '',
                lname : '',
                rank : '',
                epr_last_done : '',
                epr_next_due : '',
                aca_last_done : '',
                aca_next_due : '',
            },
            reports: [],
        }
      }; 
    }
    finally {
      this.setState({ userid: userid.user_id, amnData: amnData })
    }
  }

  render() {
      return (
        <div class="container border border-primary">
          <div className="App">
            <h4>EPR/ACA Tracker</h4>
            <EPRTable userid={this.state.userid} amnData={this.state.amnData} />
          </div>
        </div>
      )
  }
}

export default App;
