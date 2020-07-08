import React from 'react';

function EPRTable(props) {

    var epr_dates = {};
    var aca_dates = {};

    function updateEPR(event) {
        event.preventDefault();
        props.updateEPR(epr_dates[event.target.id], event.target.id)
    }

    function updateACA(event) {
        event.preventDefault();
        props.updateACA(aca_dates[event.target.id], event.target.id)
    }

    function eprDateChanged(event) {
        epr_dates[event.target.id.split('-')[0]] = event.target.value;
    }

    function acaDateChanged(event) {
        aca_dates[event.target.id.split('-')[0]] = event.target.value;
    }

    // internal helper to parse through nested JSON 
    //  structure and render a collapsible table widget with Bootstrap
    function dumpTable(data) {

        return data.map(subord => (
            <div>
                <table className="table table-sm">
                    <thead>
                        <tr className='table-primary'>
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
                            <td><button className="btn btn-primary" id={`#${subord.data.username}`} data-toggle="collapse" data-target={`#${subord.data.username}`}>{subord.data.fname + ' ' + subord.data.mi + ' ' + subord.data.lname}</button></td>
                            <td>{subord.data.rank}</td>
                            <td>                                
                                <div className="dropdown"> 
                                    {subord.data.epr_last_done}<br/>
                                    <button className="btn btn-sm btn-secondary dropdown-toggle" id={`${subord.data.user_id}`} data-toggle="dropdown">Change</button>
                                    <div className="dropdown-menu" aria-labelledby={`${subord.data.username}`}>
                                        <form className="px-4 py-3">
                                        <div className="form-group">
                                            <label for="epr_last_done_date">Date EPR Last Done:</label>
                                            <input type="date" className="form-control" id={`${subord.data.user_id}-epr_last_done_date`} onChange={eprDateChanged}/>
                                        </div>                                        
                                        <button type="submit" id={`${subord.data.user_id}`} className="btn btn-primary btn-sm" onClick={updateEPR}>Submit</button>
                                        </form>
                                    </div>
                                </div>
                            </td>
                            <td>{subord.data.epr_next_due}</td>
                            <td>
                                <div className="dropdown">
                                    {subord.data.aca_last_done}<br/>
                                    <button className="btn btn-sm btn-secondary dropdown-toggle" id={`${subord.data.user_id}`} data-toggle="dropdown">Change</button>
                                    <div className="dropdown-menu" aria-labelledby={`${subord.data.username}`}>
                                        <form className="px-4 py-3">
                                        <div className="form-group">
                                            <label for="aca_last_done_date">Date ACA Last Done:</label>
                                            <input type="date" className="form-control" id={`${subord.data.user_id}-aca_last_done_date`} onChange={acaDateChanged}/>
                                        </div>                                        
                                        <button type="button" data-toggle="dropdown" id={`${subord.data.user_id}`} className="btn btn-primary btn-sm" onClick={updateACA}>Submit</button>
                                        </form>
                                    </div>
                                </div>
                            </td>
                            <td>{subord.data.aca_next_due}</td>                    
                        </tr>
                    </tbody>                
                </table>
                <div className="collapse" id={`${subord.data.username}`}>
                    <div className="card card-body">
                        { (subord.reports && subord.reports.length > 0) ? dumpTable(subord.reports) : <div>No subordinates</div> }
                    </div>
                </div>
            </div>
            )
        )  
    }

    return (
        (props.userid === 0) ? (<div className="spinner-border text-primary" role="status">
                                <span className="sr-only">Loading...</span>
                                </div>) : (props.userid === undefined) ? (<div><h6>User Not Found</h6></div>)
            :            
                (<div>
                    <div className="alert alert-dark" role="alert">Your Rater</div>
                    <p>{props.amnData.raterInfo.rank + ' ' + props.amnData.raterInfo.fname + ' ' + props.amnData.raterInfo.mi + ' ' + props.amnData.raterInfo.lname}</p>
                    <div className="alert alert-dark" role="alert">Your Data</div>
                    <table className="table table-sm">
                        <thead>
                            <tr className='table-primary'>
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
                    <div className="alert alert-dark" role="alert">Your Subordinate Data</div>                                   
                        {
                            dumpTable(props.amnData.subordinates.reports, 0)
                        }
                </div>)
    )


}

export default EPRTable;