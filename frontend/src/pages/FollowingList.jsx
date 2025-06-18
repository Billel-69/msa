
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function FollowingList() {
    const [following, setFollowing] = useState([]);

    useEffect(() => {
        const fetchFollowing = async () => {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/following', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFollowing(res.data);
        };
        fetchFollowing();
    }, []);

    return (
        <div>
            <h2>Mes abonnements :</h2>
            {following.map(f => (
                <div key={f.id}>{f.name}</div>
            ))}
        </div>
    );
}

export default FollowingList;
