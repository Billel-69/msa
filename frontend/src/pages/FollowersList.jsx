
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function FollowersList() {
    const [followers, setFollowers] = useState([]);

    useEffect(() => {
        const fetchFollowers = async () => {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/followers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFollowers(res.data);
        };
        fetchFollowers();
    }, []);

    return (
        <div>
            <h2>Mes abonnés :</h2>
            {followers.map(f => (
                <div key={f.id}>{f.name}</div>
            ))}
        </div>
    );
}

export default FollowersList;
