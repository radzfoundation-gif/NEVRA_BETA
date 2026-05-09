const fs = require('fs');
const path = require('path');

const serverFile = "/Volumes/RADZZZ/CODING/noir'/server/index.js";
let content = fs.readFileSync(serverFile, 'utf8');

// Also update the `/api/user/feature-usage` endpoint to fix how remaining credits are returned for pro tier and daily limits
const oldGetEndpoint = `// Get current usage and credit status
app.get('/api/user/feature-usage', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    const usageData = await getUserUsage(userId);
    const tier = await getUserTier(userId);

    // Calculate remaining credits
    let remaining = usageData.limit - usageData.used;
    if (remaining < 0) remaining = 0;
    if (tier === 'pro') remaining = 999999; // effectively unlimited

    res.json({
      used: usageData.used,
      limit: usageData.limit,
      remaining,
      tier,
      credits: remaining // explicit credit count
    });
  } catch (error) {
    console.error('Error fetching feature usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});`;

const newGetEndpoint = `// Get current usage and credit status
app.get('/api/user/feature-usage', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    const usageData = await getUserUsage(userId);
    const tier = await getUserTier(userId);

    // Free tier has 20 daily credits, Pro is unlimited
    const dailyLimit = tier === 'pro' ? 999999 : 20;

    // Calculate remaining credits
    let remaining = dailyLimit - usageData.used;
    if (remaining < 0) remaining = 0;
    if (tier === 'pro') remaining = 999999; // effectively unlimited

    res.json({
      used: usageData.used,
      limit: dailyLimit,
      remaining,
      tier,
      credits: remaining // explicit credit count
    });
  } catch (error) {
    // console.error('Error fetching feature usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});`;

content = content.replace(oldGetEndpoint, newGetEndpoint);

fs.writeFileSync(serverFile, content);
console.log('Patched get endpoint');
