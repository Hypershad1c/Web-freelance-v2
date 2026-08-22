import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const before = await client.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM "Lead"');
    const deleted = await client.query('DELETE FROM "Lead"');
    const after = await client.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM "Lead"');
    await client.query("COMMIT");

    console.log(JSON.stringify({
      before: Number(before.rows[0]?.count ?? 0),
      deleted: deleted.rowCount ?? 0,
      after: Number(after.rows[0]?.count ?? 0),
    }));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
