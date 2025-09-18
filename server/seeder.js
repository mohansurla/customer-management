// seeder.js
import fetch from "node-fetch";
import { data } from "./mockData.js";

const API_URL = "http://localhost:5000/api";
const SERVER_CHECK = `${API_URL}/customers`;
const MAX_RETRIES = 12; // ~60s total with 5s backoff
const BACKOFF_MS = 5000;

async function waitForServer() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(SERVER_CHECK);
      if (res.ok || res.status === 400 || res.status === 404) {
        console.log("✅ Server is up.");
        return;
      }
    } catch (err) {
      // ignore, retry
    }
    console.log(`Waiting for server... retry ${i + 1}/${MAX_RETRIES} (sleep ${BACKOFF_MS}ms)`);
    await new Promise((r) => setTimeout(r, BACKOFF_MS));
  }
  throw new Error("Server did not become available within the expected time.");
}

async function resetDatabase() {
  console.log("🗑️ Clearing old data...");

  // Delete addresses first (because of foreign key constraint)
  await fetch(`${API_URL}/addresses/clear`, { method: "DELETE" });

  // Delete customers
  await fetch(`${API_URL}/customers/clear`, { method: "DELETE" });

  console.log("✅ Database reset complete.");
}

async function seedDatabase() {
  await waitForServer();
  await resetDatabase();

  for (const customer of data.customers) {
    try {
      // Create customer
      const res = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: customer.first_name,
          last_name: customer.last_name,
          phone_number: customer.phone_number,
        }),
      });

      const created = await res.json();

      if (!res.ok || created.error) {
        console.log("⚠️ Skipping customer:", created.error || created);
        continue;
      }

      console.log("Customer created:", created.data);
      const customerId = created.data.id;

      // Add addresses (pass is_default direct to API)
      const addresses = data.addresses.filter((a) => a.customer_id === customer.id);
      for (const addr of addresses) {
        try {
          const resAddr = await fetch(`${API_URL}/customers/${customerId}/addresses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address_details: addr.address_details,
              city: addr.city,
              state: addr.state,
              pin_code: addr.pin_code,
              is_default: !!addr.is_default, // will be converted to boolean
            }),
          });

          const addrResult = await resAddr.json();
          if (!resAddr.ok || addrResult.error) {
            console.log("⚠️ Skipping address:", addrResult.error || addrResult);
            continue;
          }

          console.log(" Address created:", addrResult.data);
        } catch (ae) {
          console.log("❌ Error creating address for customerId", customerId, ae.message);
        }
      }
    } catch (err) {
      console.error("❌ Error seeding customer:", err.message);
    }
  }

  console.log("🎉 Seeding complete!");
}

seedDatabase().catch((e) => {
  console.error("Seeder failed:", e.message);
  process.exit(1);
});
