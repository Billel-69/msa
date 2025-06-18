
import React from 'react';
import { useParams } from 'react-router-dom';

function ProfilePublic() {
    const { id } = useParams();
    return (
        <div>
            <h2>Profil utilisateur ID: {id}</h2>
            {/* A compléter avec les posts de l'utilisateur et le bouton follow */}
        </div>
    );
}

export default ProfilePublic;
