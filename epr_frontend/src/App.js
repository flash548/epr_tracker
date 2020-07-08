import React from 'react';
import EPRTable from './EPRTable';
import './App.css';

class App extends React.Component {

  constructor(props) {
    super(props);    
    this.baseurl = (process.env.NODE_ENV === 'production') ? '<prod url here>': "http://localhost:3000";
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
    var userid = {user_id: 0};
    try {
      var data = await fetch(`${this.baseurl}/user?firstname=${this.state.firstname}&lastname=${this.state.lastname}`);
      userid = await data.json();    
    }
    catch (e) { 
      userid = {user_id: 0};
    }
    finally {
      await this.getUserData(userid.user_id);
    }
  }

  // pulls a user data from the user id from the backed
  // updates state, which forces the EPRTable component to update
  getUserData = async (userid) => {
    var amnData = {};
    try {
      var data = await fetch(`${this.baseurl}/getRecord?userid=${userid}`);
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
      this.setState({ userid: userid, amnData: amnData })
    }
  }

  // updates a user's last done EPR date... by user id, then repulls current
  //  user's data to force everything to update 
  updateEPR = async (date, userid) => {
    if (!date) return;

    
    // update user's EPR date
    let newDates = {
      user_id: userid,
      epr_last_done: date,
      epr_next_due: new Date(new Date(date).setDate(new Date(date).getDate() + 360))
    };

    await fetch(`${this.baseurl}/updateUserForms`, 
      {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDates)
      });

    // repull all data
    this.getUserData(this.state.userid);
  }

  // updates a user's last done ACA date... by user id, then repulls current
  //  user's data to force everything to update 
  updateACA = async (date, userid) => {
    if (!date) return;

    
    // update user's EPR date
    let newDates = {
      user_id: userid,
      aca_last_done: date,
      aca_next_due: new Date(new Date(date).setDate(new Date(date).getDate() + 360))
    };

    await fetch(`${this.baseurl}/updateUserForms`, 
      {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDates)
      });

    // repull all data
    this.getUserData(this.state.userid);

    
  }

  render() {
      return (
        <div className="container border border-primary">
          <div className="App">
            <h4>EPR/ACA Tracker</h4>
            <EPRTable userid={this.state.userid} amnData={this.state.amnData} updateEPR={this.updateEPR} updateACA={this.updateACA} />
          </div>
        </div>
      )
  }
}

export default App;
