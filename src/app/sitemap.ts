import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://forex.tradingviewapi.com';
  
  // 主要货币对
  const majorPairs = [
    'FX_IDC:EURUSD',
    'FX_IDC:GBPUSD',
    'FX_IDC:USDJPY',
    'FX_IDC:USDCHF',
    'FX_IDC:AUDUSD',
    'FX_IDC:USDCAD',
    'FX_IDC:NZDUSD',
    'FX_IDC:USDCNY',
    'FX_IDC:USDHKD',
    'FX_IDC:USDSGD',
  ];

  const pairUrls = majorPairs.map(pair => ({
    url: `${baseUrl}/pair/${encodeURIComponent(pair)}`,
    lastModified: new Date(),
    changeFrequency: 'always' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: `${baseUrl}/converter`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rankings`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/heatmap`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/calendar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/query`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.6,
    },
    ...pairUrls,
  ];
}
