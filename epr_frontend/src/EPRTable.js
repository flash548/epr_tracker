import React from 'react';

function EPRTable(props) {

    function dumpTable(data, level) {
        return data.map(subord => (
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Rank</th>
                        <th>EPR Last Done</th>
                        <th>EPR Next Due</th>
                        <th>ACA Last Done</th>
                        <th>ACA Next Due</th>
                    </tr>
                </thead>
                <tr>
                    <td>{subord.data.fname + ' ' + subord.data.mi + ' ' + subord.data.lname}</td>
                    <td>{subord.data.rank}</td>
                    <td>{subord.data.epr_last_done}</td>
                    <td>{subord.data.epr_next_due}</td>
                    <td>{subord.data.aca_last_done}</td>
                    <td>{subord.data.aca_next_due}</td>                    
                </tr>
                { (subord.reports && subord.reports.length > 0) ? <tr><td></td><td colspan='5'>{dumpTable(subord.reports, level+1)}</td></tr> : '' }
            </table>

            )
        )  
    }

    return (
        (!props.userid) ?
            (<div><h3>No User provided!</h3></div>)           
            :            
                (<div>
                    <h3><u>Your Rater</u></h3>
                    <p>{props.amnData.raterInfo.rank + ' ' + props.amnData.raterInfo.fname + ' ' + props.amnData.raterInfo.mi + ' ' + props.amnData.raterInfo.lname}</p>
                    <h3><u>Your Data</u></h3>
                    <table class="table">
                        <thead>
                            <tr>
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
                    <h3><u>Subordinate Data</u></h3>                                   
                        {
                            dumpTable(props.amnData.subordinates.reports, 0)
                        }
                </div>)
    )


}

export default EPRTable;