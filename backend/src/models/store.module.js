import { pool } from "../db.js";

export const Store = {
    createStore : async function({
        admin_id,
        creator_id,
        assigned_ids,
        store_name,
        repo_name,
        github_link,
    }){
        const sql = `
        INSERT INTO store (admin_id, creator_id, assigned_ids, store_name, repo_name, github_link, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING *;
        `;
        const values = [
            admin_id,
            creator_id,
            assigned_ids,
            store_name,
            repo_name,
            github_link,
        ];
        const res = await pool.query(sql, values);
        return res.rows[0];
    },
    getAllStoreByCreatorId : async function({
        creator_id,
    }){
        const sql = `
        SELECT * FROM store WHERE creator_id = $1;
        `;
        const values = [creator_id];
        const res = await pool.query(sql, values);
        return res.rows;
    },
    getAllStoreByAdminId : async function({
        admin_id,
    }){
        const sql = `
        SELECT * FROM store WHERE admin_id = $1;
        `;
        const values = [admin_id];
        const res = await pool.query(sql, values);
        return res.rows;
    },
}