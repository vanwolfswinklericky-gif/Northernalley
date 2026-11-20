const DEFAULT_VERSION = '1.0.0';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const platform =
    typeof req.query?.platform === 'string' ? req.query.platform.toLowerCase() : '';

  const isAndroid = platform === 'android';
  const isIOS = platform === 'ios';
  if (!isAndroid && !isIOS) {
    return res.status(400).json({ error: 'A valid platform is required' });
  }

  const latestVersion = isIOS
    ? process.env.APP_LATEST_VERSION_IOS || DEFAULT_VERSION
    : process.env.APP_LATEST_VERSION_ANDROID || DEFAULT_VERSION;
  const minimumVersion = isIOS
    ? process.env.APP_MINIMUM_VERSION_IOS || DEFAULT_VERSION
    : process.env.APP_MINIMUM_VERSION_ANDROID || DEFAULT_VERSION;
  const forceUpdateValue = isIOS
    ? process.env.APP_FORCE_UPDATE_IOS
    : process.env.APP_FORCE_UPDATE_ANDROID;

  const storeUrl = isIOS
    ? process.env.IOS_APP_STORE_URL ||
      'https://apps.apple.com/search?term=NorthernAlley'
    : process.env.ANDROID_PLAY_STORE_URL ||
      'https://play.google.com/store/apps/details?id=com.northernalley.app';

  return res.status(200).json({
    platform,
    latestVersion,
    minimumVersion,
    forceUpdate: String(forceUpdateValue).toLowerCase() === 'true',
    storeUrl,
  });
}
