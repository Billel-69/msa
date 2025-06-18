import React, { useState } from 'react';
import './CreatePost.css';

function CreatePost() {
    const [content, setContent] = useState('');

    const handlePost = () => {
        // API call ici plus tard
        console.log('Publier:', content);
        setContent('');
    };

    return (
        <div className="create-post">
            <h3>CréezPost</h3>
            <textarea
                placeholder="Que voulez-vous partager ?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <button onClick={handlePost}>Publier</button>
        </div>
    );
}

export default CreatePost;
