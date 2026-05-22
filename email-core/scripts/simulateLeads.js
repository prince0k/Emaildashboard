import axios from 'axios';

async function simulateLead() {
  const endpoint = 'http://localhost:3001/api/welcome/send';
  const internalKey = 'dev_internal_key_12345';

  const leads = [
    { email: 'john@example.com', name: 'John Doe', siteName: 'NutriGuide', siteUrl: 'https://stewartlucas.com' },
    { email: 'sarah@test.com', name: 'Sarah Connor', siteName: 'NutriGuide', siteUrl: 'https://stewartlucas.com' },
    { email: 'mike@demo.org', name: 'Mike Ross', siteName: 'NutriGuide', siteUrl: 'https://stewartlucas.com' },
  ];

  for (const lead of leads) {
    try {
      console.log(`🚀 Simulating lead: ${lead.email}...`);
      const res = await axios.post(endpoint, lead, {
        headers: {
          'X-Internal-Key': internalKey,
          'Content-Type': 'application/json'
        }
      });
      console.log(`✅ Success:`, res.data);
    } catch (err) {
      console.error(`❌ Failed:`, err.response?.data || err.message);
    }
  }
}

simulateLead();
