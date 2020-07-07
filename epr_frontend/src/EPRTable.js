import React from 'react';

function EPRTable(props) {

    // internal helper to parse through nested JSON 
    //  structure and render a collapsible table widget with Bootstrap
    function dumpTable(data) {

        function togglePane(event) {
            event.preventDefault();
            console.log(document.getElementById(event.target.id.split('#')[1]).style)
            if (document.getElementById(event.target.id.split('#')[1]).style['display'] === "block") {
                document.getElementById(event.target.id.split('#')[1]).style = "display: none";
            }
            else {
                document.getElementById(event.target.id.split('#')[1]).style = "display: block";
            }
        }

        return data.map(subord => (
            <div>
                <table class="table table-sm">
                    <thead>
                        <tr class='table-primary'>
                            <th>Name</th>
                            <th>Rank</th>
                            <th>EPR Last Done</th>
                            <th>EPR Next Due</th>
                            <th>ACA Last Done</th>
                            <th>ACA Next Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><button class="btn btn-primary" id={`#${subord.data.username}`} onClick={togglePane}>{subord.data.fname + ' ' + subord.data.mi + ' ' + subord.data.lname}</button></td>
                            <td>{subord.data.rank}</td>
                            <td>{subord.data.epr_last_done}</td>
                            <td>{subord.data.epr_next_due}</td>
                            <td>{subord.data.aca_last_done}</td>
                            <td>{subord.data.aca_next_due}</td>                    
                        </tr>
                    </tbody>                
                </table>
                <div class="pane" id={`${subord.data.username}`}>
                    <div class="card card-body">
                        { (subord.reports && subord.reports.length > 0) ? dumpTable(subord.reports) : <div>No subordinates</div> }
                    </div>
                </div>
            </div>
            )
        )  
    }

    return (
        (props.userid === 0) ? (<div class="spinner-border text-primary" role="status">
                                <span class="sr-only">Loading...</span>
                                </div>) : (props.userid === undefined) ? (<div><h6>User Not Found</h6></div>)
            :            
                (<div>
                    <div class="alert alert-dark" role="alert">Your Rater</div>
                    <p>{props.amnData.raterInfo.rank + ' ' + props.amnData.raterInfo.fname + ' ' + props.amnData.raterInfo.mi + ' ' + props.amnData.raterInfo.lname}</p>
                    <div class="alert alert-dark" role="alert">Your Data</div>
                    <table class="table table-sm">
                        <thead>
                            <tr class='table-primary'>
                                <th>Name</th>
                                <th>Rank</th>
                                <th>EPR Last Done</th>
                                <th>EPR Next Due</th>
                                <th>ACA Last Done</th>
                                <th>ACA Next Due</th>
                            </tr>
                            <tr>
                                <td>{props.amnData.subordinates.data.fname + ' ' + props.amnData.subordinates.data.mi + ' ' + props.amnData.subordinates.data.lname}</td>
                                <td>{props.amnData.subordinates.data.rank}</td>
                                <td>{props.amnData.subordinates.data.epr_last_done}</td>
                                <td>{props.amnData.subordinates.data.epr_next_due}</td>
                                <td>{props.amnData.subordinates.data.aca_last_done}</td>
                                <td>{props.amnData.subordinates.data.aca_next_due}</td>
                            </tr>
                        </thead>
                    </table>            
                    <div class="alert alert-dark" role="alert">Your Subordinate Data</div>                                   
                        {
                            dumpTable(props.amnData.subordinates.reports, 0)
                        }
                </div>)
    )


}

export default EPRTable;