const fs = require('fs');
const path = require('path');

const serverFile = "/Volumes/RADZZZ/CODING/noir'/server/index.js";
let content = fs.readFileSync(serverFile, 'utf8');

// We need to fix checkFeatureUsage and incrementFeatureUsage to use the daily credit pool
// So that when the backend checks limits for generation, it also uses the daily credits

const oldCheckFeatureUsage = `const checkFeatureUsage = async (userId, feature) => {
  if (!supabase) return { allowed: true, limit: 999, used: 0 };

  const tier = await getUserTier(userId);
  const userLimits = FEATURE_LIMITS[tier] || FEATURE_LIMITS.free;
  const config = userLimits[feature] || userLimits.chat;

  const periodKey = getPeriodString(config.period);
  const storageKey = \`\${periodKey}_\${feature}\`; // stored in 'month' column

  try {
    const { data } = await supabase
      .from('token_usage')
      .select('tokens_used')
      .eq('user_id', userId)
      .eq('month', storageKey)
      .maybeSingle();

    const used = data?.tokens_used || 0;

    if (tier === 'pro') return { allowed: true, limit: config.limit, used, tier };

    return {
      allowed: used < config.limit,
      limit: config.limit,
      used,
      tier
    };
  } catch (e) {
    console.warn(\`Usage check failed for \${userId}:\`, e);
    return { allowed: true, limit: config.limit, used: 0, tier: 'free' };
  }
};`;

const newCheckFeatureUsage = `const checkFeatureUsage = async (userId, feature) => {
  if (!supabase) return { allowed: true, limit: 999, used: 0 };

  const tier = await getUserTier(userId);
  const cost = FEATURE_COSTS[feature] || 1;
  
  // Free tier has 20 daily credits, Pro is unlimited
  const dailyLimit = tier === 'pro' ? 999999 : 20;

  const d = new Date();
  const storageKey = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}_\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;

  try {
    const { data } = await supabase
      .from('token_usage')
      .select('tokens_used')
      .eq('user_id', userId)
      .eq('month', storageKey)
      .maybeSingle();

    const used = data?.tokens_used || 0;

    if (tier === 'pro') return { allowed: true, limit: dailyLimit, used, tier };

    return {
      allowed: (used + cost) <= dailyLimit,
      limit: dailyLimit,
      used,
      tier
    };
  } catch (e) {
    console.warn(\`Usage check failed for \${userId}:\`, e);
    return { allowed: true, limit: dailyLimit, used: 0, tier: 'free' };
  }
};`;

const oldIncrementFeatureUsage = `const incrementFeatureUsage = async (userId, feature) => {
  if (!supabase) return;

  const tier = await getUserTier(userId);
  const userLimits = FEATURE_LIMITS[tier] || FEATURE_LIMITS.free;
  const config = userLimits[feature] || userLimits.chat;

  const periodKey = getPeriodString(config.period);
  const storageKey = \`\${periodKey}_\${feature}\`;

  try {
    const { data } = await supabase
      .from('token_usage')
      .select('tokens_used')
      .eq('user_id', userId)
      .eq('month', storageKey)
      .maybeSingle();

    const current = data?.tokens_used || 0;

    await supabase.from('token_usage').upsert({
      user_id: userId,
      month: storageKey,
      tokens_used: current + 1,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, month' });

  } catch (e) {
    console.error(\`Usage increment failed for \${userId}:\`, e);
  }
};`;

const newIncrementFeatureUsage = `const incrementFeatureUsage = async (userId, feature) => {
  if (!supabase) return;

  const tier = await getUserTier(userId);
  if (tier === 'pro') return; // Pro users don't increment usage here if unlimited
  
  const cost = FEATURE_COSTS[feature] || 1;

  const d = new Date();
  const storageKey = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}_\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;

  try {
    const { data } = await supabase
      .from('token_usage')
      .select('tokens_used')
      .eq('user_id', userId)
      .eq('month', storageKey)
      .maybeSingle();

    const current = data?.tokens_used || 0;

    await supabase.from('token_usage').upsert({
      user_id: userId,
      month: storageKey,
      tokens_used: current + cost,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, month' });

  } catch (e) {
    console.error(\`Usage increment failed for \${userId}:\`, e);
  }
};`;

content = content.replace(oldCheckFeatureUsage, newCheckFeatureUsage);
content = content.replace(oldIncrementFeatureUsage, newIncrementFeatureUsage);

fs.writeFileSync(serverFile, content);
console.log('Patched checkFeatureUsage and incrementFeatureUsage');
