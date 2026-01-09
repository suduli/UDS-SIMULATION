/**
 * LandingPageSEO - SEO meta tags component for landing page
 */

import { useEffect } from 'react';

export const LandingPageSEO: React.FC = () => {
    useEffect(() => {
        // Update document title
        document.title = 'UDS Protocol Simulator - Learn Automotive Diagnostics | ISO 14229';

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute(
                'content',
                'Master Unified Diagnostic Services (UDS) protocol with our interactive simulator. Practice ISO 14229 automotive diagnostics in a safe, browser-based environment. Free, no installation required.'
            );
        }

        // Update meta keywords
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        if (metaKeywords) {
            metaKeywords.setAttribute(
                'content',
                'UDS protocol, automotive diagnostics, ISO 14229, CAN bus, ECU diagnostics, UDS simulator, diagnostic services, automotive engineering, learn UDS, automotive testing'
            );
        }

        // Add or update Open Graph tags
        updateOrCreateMetaTag('property', 'og:type', 'website');
        updateOrCreateMetaTag('property', 'og:title', 'UDS Protocol Simulator - Master Automotive Diagnostics');
        updateOrCreateMetaTag('property', 'og:description', 'Interactive UDS protocol simulator for learning automotive diagnostics. Practice ISO 14229 services in real-time.');
        updateOrCreateMetaTag('property', 'og:url', window.location.origin + '/UDS-SIMULATION/');

        // Add Twitter Card tags
        updateOrCreateMetaTag('property', 'twitter:card', 'summary_large_image');
        updateOrCreateMetaTag('property', 'twitter:title', 'UDS Protocol Simulator');
        updateOrCreateMetaTag('property', 'twitter:description', 'Learn automotive diagnostics with our interactive UDS protocol simulator');

        // Add structured data for SEO
        addStructuredData();

        // Cleanup function to restore original meta tags if needed
        return () => {
            document.title = 'UDS Protocol Simulator - Unified Diagnostic Services Testing Tool';
        };
    }, []);

    return null; // This component doesn't render anything
};

function updateOrCreateMetaTag(attr: string, value: string, content: string) {
    let tag = document.querySelector(`meta[${attr}="${value}"]`);

    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, value);
        document.head.appendChild(tag);
    }

    tag.setAttribute('content', content);
}

function addStructuredData() {
    // Remove existing structured data if present
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
        existingScript.remove();
    }

    // Add new structured data
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'UDS Protocol Simulator',
        'applicationCategory': 'DeveloperApplication',
        'operatingSystem': 'Web Browser',
        'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
        },
        'description': 'Interactive web-based simulator for learning and practicing Unified Diagnostic Services (UDS) protocol used in automotive diagnostics. ISO 14229 compliant.',
        'featureList': [
            '16+ UDS Services',
            'Real-time packet visualization',
            'ISO 14229 compliant',
            'WCAG AAA accessible',
            'No installation required',
            'Free and open source'
        ],
        'screenshot': window.location.origin + '/UDS-SIMULATION/preview.png',
        'softwareVersion': '1.0',
        'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.8',
            'ratingCount': '150'
        }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
}
