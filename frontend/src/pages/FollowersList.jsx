
import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

function FollowersList() {
    const [followers, setFollowers] = useState([]);

    useEffect(() => {
        const fetchFollowers = async () => {
            const token = localStorage.getItem('token');
            const res = await axiosInstance.get('/followers');
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
