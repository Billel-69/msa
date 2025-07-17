const db = require('../config/db');

exports.findUserByEmail = async (email) => {
    const [rows] = await db.execute('SELECT *, is_suspended, is_super_admin FROM users WHERE email = ?', [email]);
    return rows[0];
};

exports.findUserByUsername = async (username) => {
    const [rows] = await db.execute('SELECT *, is_suspended, is_super_admin FROM users WHERE username = ?', [username]);
    return rows[0];
};

exports.findUserByEmailOrUsername = async (identifier) => {
    const [rows] = await db.execute(
        'SELECT *, is_suspended, is_super_admin FROM users WHERE email = ? OR username = ?',
        [identifier, identifier]
    );
    return rows[0];
};

exports.createUser = async (userData) => {
    const { name, username, email, hashedPassword, accountType, parentId = null } = userData;

    const [result] = await db.execute(
        'INSERT INTO users (name, username, email, password, account_type, parent_id) VALUES (?, ?, ?, ?, ?, ?)',
        [name, username, email, hashedPassword, accountType, parentId]
    );
    return result.insertId;
};

exports.linkChildToParent = async (parentId, childId) => {
    try {
        await db.execute(
            'INSERT INTO child_parent_links (parent_id, child_id) VALUES (?, ?)',
            [parentId, childId]
        );
        return true;
    } catch (error) {
        console.error('Erreur lors de la liaison parent-enfant:', error);
        return false;
    }
};

exports.getChildrenByParentId = async (parentId) => {
    const [rows] = await db.execute(`
        SELECT u.id, u.name, u.username, u.email, u.level, u.profile_picture, u.created_at
        FROM users u
        JOIN child_parent_links cpl ON u.id = cpl.child_id
        WHERE cpl.parent_id = ?
    `, [parentId]);
    return rows;
};

exports.updateUserProfile = async (userId, updates) => {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && updates[key] !== null) {
            fields.push(`${key} = ?`);
            values.push(updates[key]);
        }
    });

    if (fields.length === 0) return false;

    values.push(userId);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

    await db.execute(query, values);
    return true;
};

exports.checkUsernameAvailability = async (username, excludeUserId = null) => {
    let query = 'SELECT id FROM users WHERE username = ?';
    let params = [username];

    if (excludeUserId) {
        query += ' AND id != ?';
        params.push(excludeUserId);
    }

    const [rows] = await db.execute(query, params);
    return rows.length === 0;
};

exports.checkEmailAvailability = async (email, excludeUserId = null) => {
    let query = 'SELECT id FROM users WHERE email = ?';
    let params = [email];

    if (excludeUserId) {
        query += ' AND id != ?';
        params.push(excludeUserId);
    }

    const [rows] = await db.execute(query, params);
    return rows.length === 0;
};