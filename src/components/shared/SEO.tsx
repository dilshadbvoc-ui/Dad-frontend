import { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonical?: string;
}

const SEO = ({
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
    canonical
}: SEOProps) => {
    useEffect(() => {
        // Update Title
        const fullTitle = `${title} | Pype CRM`;
        document.title = fullTitle;

        // Update Meta Description
        if (description) {
            let metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', description);
            } else {
                metaDescription = document.createElement('meta');
                metaDescription.setAttribute('name', 'description');
                metaDescription.setAttribute('content', description);
                document.head.appendChild(metaDescription);
            }
        }

        // Update Meta Keywords
        if (keywords) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (metaKeywords) {
                metaKeywords.setAttribute('content', keywords);
            } else {
                metaKeywords = document.createElement('meta');
                metaKeywords.setAttribute('name', 'keywords');
                metaKeywords.setAttribute('content', keywords);
                document.head.appendChild(metaKeywords);
            }
        }

        // Update Open Graph tags if provided
        const ogTags = {
            'og:title': ogTitle || title,
            'og:description': ogDescription || description,
            'og:image': ogImage,
            'og:url': window.location.href
        };

        Object.entries(ogTags).forEach(([property, content]) => {
            if (content) {
                let tag = document.querySelector(`meta[property="${property}"]`);
                if (tag) {
                    tag.setAttribute('content', content);
                } else {
                    tag = document.createElement('meta');
                    tag.setAttribute('property', property);
                    tag.setAttribute('content', content);
                    document.head.appendChild(tag);
                }
            }
        });

        // Update Canonical Link
        if (canonical) {
            let linkCanonical = document.querySelector('link[rel="canonical"]');
            if (linkCanonical) {
                linkCanonical.setAttribute('href', canonical);
            } else {
                linkCanonical = document.createElement('link');
                linkCanonical.setAttribute('rel', 'canonical');
                linkCanonical.setAttribute('href', canonical);
                document.head.appendChild(linkCanonical);
            }
        }

    }, [title, description, keywords, ogTitle, ogDescription, ogImage, canonical]);

    return null;
};

export default SEO;
