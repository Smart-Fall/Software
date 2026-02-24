import { Pool } from 'pg';

const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "CEG4912",
    database: "smartfall_db"
});

export default pool;