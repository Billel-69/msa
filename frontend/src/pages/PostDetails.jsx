
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function PostDetails() {
    const { id } = useParams();
    const [post, setPost] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/posts/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPost(res.data);
        };
        fetchPost();
    }, [id]);

    if (!post) return <p>Chargement...</p>;

    return (
        <div>
            <h3>{post.content}</h3>
            <p>Posté le {new Date(post.created_at).toLocaleString()}</p>
        </div>
    );
}

export default PostDetails;
