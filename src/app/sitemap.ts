import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://campusnaksha.vercel.app'

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/dashboard`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/dashboard/parking`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/dashboard/alertMap`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/sos`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/admin`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/guardDashboard`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
        }
    ]
}