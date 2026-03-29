// Scheduled function: pulls Meta Ads data daily at 8am IST and saves to Supabase
// Runs server-side — no browser, no manual clicks needed

const META_AD_ACCOUNTS = [
  { id: 'act_925205080936963', name: 'Cuemath - Intel - ROW', market: 'ROW' },
  { id: 'act_5215842511824318', name: 'Cuemath - US & Canada', market: 'US' },
  { id: 'act_888586384639855', name: 'Cuemath-Demand-India', market: 'India' },
];

const FIELDS = 'campaign_name,adset_name,ad_name,spend,impressions,clicks,actions,cost_per_action_type,frequency,reach,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions';

function extractQL(actions) {
  if (!actions || !Array.isArray(actions)) return 0;
  const priority = ['lead', 'offsite_conversion.fb_pixel_lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.custom.lead', 'complete_registration', 'offsite_conversion.fb_pixel_complete_registration'];
  for (const type of priority) {
    const match = actions.find(a => a.action_type === type);
    if (match) return parseInt(match.value) || 0;
  }
  return 0;
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function extractDateFromAdName(adName) {
  const m = adName.match(/(\d{2})(\d{2})(\d{2})$/);
  if (m) {
    const [, dd, mm, yy] = m;
    const year = parseInt(yy) + 2000;
    if (year >= 2024 && year <= 2027 && parseInt(mm) >= 1 && parseInt(mm) <= 12 && parseInt(dd) >= 1 && parseInt(dd) <= 31) {
      return `${year}-${mm}-${dd}`;
    }
  }
  return null;
}

export default async () => {
  const META_TOKEN = Netlify.env.get('META_ACCESS_TOKEN');
  const SUPABASE_URL = Netlify.env.get('SUPABASE_URL') || 'https://lcixlyyzlnzeiqjdbxfh.supabase.co';
  const SUPABASE_KEY = Netlify.env.get('SUPABASE_KEY') || Netlify.env.get('SUPABASE_ANON_KEY');

  if (!META_TOKEN) {
    console.log('SKIP: META_ACCESS_TOKEN not set');
    return new Response(JSON.stringify({ error: 'No META_ACCESS_TOKEN' }), { status: 500 });
  }

  console.log(`Daily pull started at ${new Date().toISOString()}`);
  const allAds = [];
  const errors = [];

  // Pull from each Meta account
  for (const account of META_AD_ACCOUNTS) {
    console.log(`Pulling from ${account.name}...`);
    try {
      let url = `https://graph.facebook.com/v21.0/${account.id}/insights?level=ad&fields=${FIELDS}&date_preset=last_30d&limit=500&access_token=${META_TOKEN}`;
      let page = 0;

      while (url && page < 20) {
        page++;
        const res = await fetch(url);
        const data = await res.json();

        if (data.error) {
          errors.push(`${account.name}: ${data.error.message}`);
          break;
        }

        if (data.data) {
          data.data.forEach(row => {
            const spend = parseFloat(row.spend || 0);
            if (spend <= 0) return;

            const adName = row.ad_name || '';
            const ql = extractQL(row.actions);
            const id = hashCode(adName + '|' + (row.campaign_name || '') + '|' + (row.adset_name || '') + '|' + account.id);

            allAds.push({
              id,
              ad_name: adName,
              campaign_name: row.campaign_name || '',
              ad_set_name: row.adset_name || '',
              spent: spend,
              ql,
              impressions: parseInt(row.impressions || 0),
              clicks: parseInt(row.clicks || 0),
              _market: account.market,
              _account: account.id,
              _date: extractDateFromAdName(adName),
              updated_at: new Date().toISOString(),
            });
          });
        }

        url = data.paging?.next || null;
        if (url) await new Promise(r => setTimeout(r, 2000)); // Rate limit
      }

      console.log(`${account.name}: ${page} pages pulled`);
    } catch (e) {
      errors.push(`${account.name}: ${e.message}`);
      console.error(`Error pulling ${account.name}:`, e.message);
    }
  }

  console.log(`Total ads pulled: ${allAds.length}, errors: ${errors.length}`);

  // Save to Supabase
  if (allAds.length > 0 && SUPABASE_URL && SUPABASE_KEY) {
    const BATCH_SIZE = 500;
    let saved = 0;

    for (let i = 0; i < allAds.length; i += BATCH_SIZE) {
      const batch = allAds.slice(i, i + BATCH_SIZE);
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/tagged_creatives`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(batch),
        });

        if (res.ok) {
          saved += batch.length;
        } else {
          const err = await res.text();
          console.error(`Supabase batch ${i}-${i + batch.length} failed:`, err);
        }
      } catch (e) {
        console.error(`Supabase batch error:`, e.message);
      }
    }

    console.log(`Saved ${saved}/${allAds.length} ads to Supabase`);
  } else if (!SUPABASE_KEY) {
    console.log('SKIP Supabase: No SUPABASE_KEY/SUPABASE_ANON_KEY env var');
  }

  const summary = {
    timestamp: new Date().toISOString(),
    ads_pulled: allAds.length,
    errors: errors.length,
    error_details: errors,
    accounts: META_AD_ACCOUNTS.map(a => a.name),
  };

  console.log('Daily pull complete:', JSON.stringify(summary));
  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// 8:00 AM IST = 2:30 AM UTC
export const config = {
  schedule: '30 2 * * *',
};
