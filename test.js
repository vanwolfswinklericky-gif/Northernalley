async function testRegister() {
  console.log("--- 1. REGISTERING PASSWORD ---");
  const res = await fetch('https://northernalley.vercel.app/auth/register-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'davidadefoyeku@gmail.com', password: '@Davidsax1' })
  });
  console.log("Register Status:", res.status);
  console.log("Register Body:", await res.text());
}

async function testVerify() {
  console.log("\n--- 2. VERIFYING PASSWORD ---");
  const res = await fetch('https://northernalley.vercel.app/auth/verify-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'davidadefoyeku@gmail.com', password: '@Davidsax1' })
  });
  console.log("Verify Status:", res.status);
  console.log("Verify Body:", await res.text());
}

// Run both one after the other
async function run() {
  await testRegister();
  await testVerify();
}

run();