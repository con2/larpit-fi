import { larppikuvatApiUrl } from "@/config";
import { syncFromLarppikuvat } from "@/models/larppikuvatSync";
import { db } from "@/prisma/db";
import { pool } from "@/prisma/pool";

async function main() {
  try {
    const result = await syncFromLarppikuvat({ apiUrl: larppikuvatApiUrl });
    console.log(
      `larppikuvat sync: added ${result.added}, unchanged ${result.unchanged}, mismatched ${result.mismatched}, missing ${result.missing}`,
    );
  } finally {
    await db.close();
    await pool.end();
  }
}

if (import.meta.url === "file://" + process.argv[1]) {
  main();
}
